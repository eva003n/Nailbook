/**
 * Background worker entry point.
 *
 * One process runs a BullMQ Worker per queue and registers a single graceful
 * shutdown that drains all of them.

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
import {createServer} from "http"

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


// Deployment purposes only: Render only allows web services on free trier not private ones
createServer((req, res) => {
  res.end("")
}).listen(3000, () => {
  log.info({
    event: "worker.process.started",
    workers: workers.map((w) => w.name),
    pid: process.pid,
  });
})