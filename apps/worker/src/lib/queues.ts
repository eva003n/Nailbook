import { createQueues } from "@wannys-nails/core";
import { _config } from "./config.js";
import { redis } from "./redis.js";

const QUEUE_KEY_PREFIX = `${_config.APP_NAME}:bull:`

// queuss by producers
export const { conversationQueue, paymentQueue, notificationQueue } = createQueues(redis, QUEUE_KEY_PREFIX);
