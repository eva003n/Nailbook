import { createRedisClient } from "@wannys-nails/core";
import { _config } from "./config.js";

const CONNECTION_NAME = "worker";
const WORKER_KEY_PREFIX = `${_config.APP_NAME}:worker:`;

export const redis = createRedisClient({
  name: CONNECTION_NAME,
  config: _config,
  keyPrefix: WORKER_KEY_PREFIX,
});

// BullMQ rejects ioredis keyPrefix (it namespaces via the `prefix` option), so queues use an unprefixed client
export const queueRedis = createRedisClient({
  name: `${CONNECTION_NAME}`,
  config: _config,
  keyPrefix: undefined,
});

// BullMQ Workers take connection options and open their own connections, so
// every worker in this process shares these options rather than a client each.
export const bullConnection = { ...redis.options, keyPrefix: undefined };
