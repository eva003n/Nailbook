/**
 * Process-wide graceful shutdown for the single worker process.
 *
 * Drains every BullMQ Worker first (in-flight jobs finish), then closes the
 * Queues, Redis and Prisma, flushes the logger and exits. Registered once from
 * index.ts — calling it per worker would let the first one to finish call
 * process.exit() while the others are still draining.
 *
 * Kept free of imports from ./index.js so tests can drive it with fakes.
 */

import type { createLogger } from "@wannys-nails/core";

type Logger = ReturnType<typeof createLogger>;

interface Closable {
  close(): Promise<void>;
}

export interface ShutdownResources {
  workers: ReadonlyArray<Closable>;
  queues: ReadonlyArray<Closable>;
  redis: { quit(): Promise<unknown> };
  prisma: { $disconnect(): Promise<void> };
  logger: Pick<Logger, "info" | "error" | "flush">;
  /** Hard cap before a forced exit(1). Default 25s. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 25_000;

/**
 * Builds the shutdown routine. It runs at most once: later calls (a second
 * SIGTERM while draining, an exception during teardown) are ignored.
 */
export function createShutdown(
  r: ShutdownResources,
): (reason: string, exitCode: number) => Promise<void> {
  const timeoutMs = r.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let started = false;

  return async (reason, exitCode) => {
    if (started) return;
    started = true;

    r.logger.info({ event: "worker.shutdown.start", reason });

    const forceExit = setTimeout(() => {
      r.logger.error({ event: "worker.shutdown.timeout", timeoutMs });
      process.exit(1);
    }, timeoutMs);
    forceExit.unref();

    let code = exitCode;
    const step = async (name: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (err: unknown) {
        code = 1;
        r.logger.error({
          event: "worker.shutdown.step_failed",
          step: name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    await step("workers", () =>
      Promise.all(r.workers.map((w) => w.close())),
    );
    await step("queues", () => Promise.all(r.queues.map((q) => q.close())));
    await step("redis", () => r.redis.quit());
    await step("prisma", () => r.prisma.$disconnect());

    r.logger.info({ event: "worker.shutdown.complete", exitCode: code });
    await step(
      "logger",
      () => new Promise<void>((resolve) => r.logger.flush(() => resolve())),
    );

    clearTimeout(forceExit);
    process.exit(code);
  };
}

export function registerShutdown(r: ShutdownResources): void {
  const shutdown = createShutdown(r);

  process.on("SIGTERM", () => void shutdown("SIGTERM", 0));
  process.on("SIGINT", () => void shutdown("SIGINT", 0));

  process.on("uncaughtException", (err) => {
    r.logger.error({ event: "worker.uncaught", error: err.message });
    void shutdown("uncaughtException", 1);
  });

  process.on("unhandledRejection", (reason) => {
    r.logger.error({
      event: "worker.unhandled_rejection",
      reason: String(reason),
    });
  });
}
