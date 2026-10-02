import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createShutdown, registerShutdown } from "./shutdown.js";
import type { ShutdownResources } from "./shutdown.js";

function setup(overrides: Partial<ShutdownResources> = {}) {
  const calls: string[] = [];
  const closable = (name: string) => ({
    close: vi.fn(async () => {
      calls.push(name);
    }),
  });

  const resources = {
    workers: [closable("worker:a"), closable("worker:b")],
    queues: [closable("queue:a")],
    redis: {
      quit: vi.fn(async () => {
        calls.push("redis");
      }),
    },
    prisma: {
      $disconnect: vi.fn(async () => {
        calls.push("prisma");
      }),
    },
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      flush: vi.fn((cb?: () => void) => {
        calls.push("flush");
        cb?.();
      }),
    },
    ...overrides,
  } as unknown as ShutdownResources;

  return { resources, calls };
}

describe("createShutdown", () => {
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("drains workers, then queues, redis, prisma and the logger, then exits 0", async () => {
    const { resources, calls } = setup();

    await createShutdown(resources)("SIGTERM", 0);

    expect(calls).toEqual([
      "worker:a",
      "worker:b",
      "queue:a",
      "redis",
      "prisma",
      "flush",
    ]);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("runs once when signalled again while draining", async () => {
    const { resources } = setup();
    const shutdown = createShutdown(resources);

    await Promise.all([shutdown("SIGTERM", 0), shutdown("SIGINT", 0)]);

    expect(resources.redis.quit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("exits with the given code for a fatal error", async () => {
    const { resources } = setup();

    await createShutdown(resources)("uncaughtException", 1);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("keeps tearing down after a failed step and exits 1", async () => {
    const { resources, calls } = setup();
    vi.mocked(resources.queues[0]!.close).mockRejectedValueOnce(
      new Error("boom"),
    );

    await createShutdown(resources)("SIGTERM", 0);

    expect(calls).toEqual(["worker:a", "worker:b", "redis", "prisma", "flush"]);
    expect(resources.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "worker.shutdown.step_failed",
        step: "queues",
        error: "boom",
      }),
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("forces exit(1) when draining outlasts the timeout", async () => {
    vi.useFakeTimers();
    const { resources } = setup({
      workers: [{ close: () => new Promise<void>(() => undefined) }],
      timeoutMs: 1_000,
    });

    void createShutdown(resources)("SIGTERM", 0);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(exit).toHaveBeenCalledWith(1);
    expect(resources.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ event: "worker.shutdown.timeout" }),
    );
  });
});

describe("registerShutdown", () => {
  it("shuts down on SIGTERM, but only logs unhandled rejections", async () => {
    const handlers = new Map<string, (arg?: unknown) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      handler: (arg?: unknown) => void,
    ) => {
      handlers.set(event, handler);
      return process;
    }) as never);
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
    const { resources } = setup();

    registerShutdown(resources);

    handlers.get("unhandledRejection")?.(new Error("nope"));
    expect(exit).not.toHaveBeenCalled();
    expect(resources.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ event: "worker.unhandled_rejection" }),
    );

    handlers.get("SIGTERM")?.();
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
  });
});
