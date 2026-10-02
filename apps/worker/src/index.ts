/**
 * Background worker entry point.
 *
 * One process runs a BullMQ Worker per queue and registers a single graceful
 * shutdown that drains all of them.
 * Run: node dist/index.js
 */

import {
  conversationQueue,
  log,
  notificationQueue,
  paymentQueue,
  prisma,
  redis,
  rootLogger,
} from "./lib/index.js";
import { registerShutdown } from "./lib/shutdown.js";
import { createConversationWorker } from "./conversation/worker.js";
import { createNotificationWorker } from "./notification/worker.js";
import { createPaymentWorker } from "./payment/worker.js";

const workers = [
  createConversationWorker(),
  createPaymentWorker(),
  createNotificationWorker(),
];

registerShutdown({
  workers,
  queues: [conversationQueue, paymentQueue, notificationQueue],
  redis,
  prisma,
  logger: rootLogger,
});

log.info({
  event: "worker.process.started",
  workers: workers.map((w) => w.name),
  pid: process.pid,
});
