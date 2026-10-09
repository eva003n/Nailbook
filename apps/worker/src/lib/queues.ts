import { createQueues } from "@wannys-nails/core";
import { _config } from "./config.js";
import { queueRedis } from "./redis.js";

export const QUEUE_KEY_PREFIX = `${_config.APP_NAME}:bull:`

// queuss by producers
export const { conversationQueue, paymentQueue, notificationQueue } = createQueues(queueRedis,QUEUE_KEY_PREFIX);
