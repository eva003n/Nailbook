import { createRedisClient } from "@wannys-nails/core";
import { _config } from "./config.js";

export const redis = createRedisClient("worker", _config);

// BullMQ Workers take connection options and open their own connections, so
// every worker in this process shares these options rather than a client each.
export const bullConnection = redis.options;
