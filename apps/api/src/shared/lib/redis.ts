import { _config } from "./config.js";
import { logger } from "./logger.js";
import { createRedisClient } from "@wannys-nails/core";
import {IORedisStore} from "connect-ioredis-store"
import {RedisStore, type RedisReply} from "rate-limit-redis"

const connectionName = `${_config.APP_NAME}`;

// shared redis connection for caching | queues
export const redis = createRedisClient(connectionName, _config);

const SESSION_PREFIX = ":api:session"
export const sessionStore =  new IORedisStore({
  client: redis,
  prefix: connectionName + SESSION_PREFIX
});

const RATE_LIMIT_PREFIX = ":api:ratelimit"
// each limiter needs its own prefix, otherwise limiters keyed by IP share counters (ERR_ERL_DOUBLE_COUNT)
export const rateLimitStore = (name: string) => new RedisStore({
  sendCommand:  async (command,...args) =>  (await redis.call(command, ...args)) as RedisReply,
  prefix: `${connectionName}${RATE_LIMIT_PREFIX}:${name}:`,
})



redis.on("connect", () => {
  logger.info(
    JSON.stringify({
      event: "Redis.connected",
      message: `[Redis:${connectionName}] connected`,
    }),
  );
});

redis.on("close", () => {
  logger.warn(
    JSON.stringify({
      event: "Redis.disconnected",
      message: `[Redis:${connectionName}] connection closed`,
    }),
  );
});

redis.on("reconnecting", () => {
  logger.warn(
    JSON.stringify({
      event: "Redis.disconnected",
      message: `[Redis:${connectionName}] reconnecting`,
    }),
  );
});

redis.on("error", (err: Error) => {
  logger.error(
    JSON.stringify({
      event: "Redis.connection.error",
      connectionName: connectionName,
      error: err,
    }),
  );
});


// since redis subscriber is a blocking connection create new connection(Redis instance) with same config options
// prevent blocking the main redis connection used by the api
export const subscriber = redis.duplicate()

