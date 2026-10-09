import { _config } from "./config.js";
import { logger } from "./logger.js";
import { createRedisClient } from "@nailbook/core";
import {IORedisStore} from "connect-ioredis-store"
import {RedisStore, type RedisReply} from "rate-limit-redis"

/* ----------- Redis connection instances ---------- */
const CONNECTION_NAME = "api"
// ioredis prepends this to every key automatically, so stores below must only add their own segment (store:...)
const API_KEY_PREFIX = `${_config.APP_NAME}:api:`

// shared redis connection for caching | data store
export const redis = createRedisClient({name: CONNECTION_NAME, config:_config, keyPrefix: API_KEY_PREFIX });

// BullMQ rejects ioredis keyPrefix (it namespaces via the Queue `prefix` option), so queues get an unprefixed client
export const queueRedis = createRedisClient({name: `${CONNECTION_NAME}-queue`, config:_config, keyPrefix: undefined });

// since redis subscriber is a blocking connection create new connection(Redis instance) with same config options
// prevent blocking the main redis connection used by the api

export const subscriber = createRedisClient({name: `${CONNECTION_NAME + "-subscribe"}`, config: _config, keyPrefix: undefined})


/* ------------ Data store--------------- */
const SESSION_PREFIX = "session:"
export const sessionStore =  new IORedisStore({
  client: redis,
  prefix: SESSION_PREFIX
});

const RATE_LIMIT_PREFIX = "ratelimit:"
// each limiter needs its own prefix, otherwise limiters keyed by IP share counters (ERR_ERL_DOUBLE_COUNT)
export const rateLimitStore = (name: string) => new RedisStore({
  sendCommand:  async (command,...args) =>  (await redis.call(command, ...args)) as RedisReply,
  prefix: `${RATE_LIMIT_PREFIX}${name}:`,
})


redis.on("connect", () => {
  logger.info(
    JSON.stringify({
      event: "Redis.connected",
      message: `[Redis:${API_KEY_PREFIX}] connected`,
    }),
  );
});

redis.on("close", () => {
  logger.warn(
    JSON.stringify({
      event: "Redis.disconnected",
      message: `[Redis:${API_KEY_PREFIX}] connection closed`,
    }),
  );
});

redis.on("reconnecting", () => {
  logger.warn(
    JSON.stringify({
      event: "Redis.disconnected",
      message: `[Redis:${API_KEY_PREFIX}] reconnecting`,
    }),
  );
});

redis.on("error", (err: Error) => {
  logger.error(
    JSON.stringify({
      event: "Redis.connection.error",
      connectionName: API_KEY_PREFIX,
      error: err,
    }),
  );
});




