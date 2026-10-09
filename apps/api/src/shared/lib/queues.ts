import { createQueues } from "@wannys-nails/core";
import { _config } from "./config.js";
import { redis} from "./redis.js";

const QUEUE_KEY_PREFIX = `${_config.APP_NAME}:bull:`
// queuss by producers 
export const {notificationQueue, conversationQueue, paymentQueue} = createQueues(redis, QUEUE_KEY_PREFIX)