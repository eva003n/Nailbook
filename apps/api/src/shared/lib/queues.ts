import { createQueues } from "@nailbook/core";
import { _config } from "./config.js";
import { queueRedis } from "./redis.js";

const QUEUE_KEY_PREFIX = `${_config.APP_NAME}:bull:`
// queuss by producers 
export const {notificationQueue, conversationQueue, paymentQueue} = createQueues(queueRedis,QUEUE_KEY_PREFIX)