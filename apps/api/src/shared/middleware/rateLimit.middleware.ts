import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {logger} from "../lib/logger.js"
import { rateLimitStore } from "../lib/redis.js";

const rateLimitLogger = logger.child({module: "rate limiter"})

// scoped per limiter so no two limiters can ever produce the same key for a request
const ipKey = (scope: string) => (req: Request): string =>
  `${scope}:${ipKeyGenerator(req.ip ?? "unknown")}`;

/**
 * Global rate limiter: 300 requests per 15 minutes per IP.
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: true,
  store: rateLimitStore("global"),
  keyGenerator: ipKey("global"),
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please wait before retrying.",
      details: { retryAfterSeconds: 60 },
    },
  },
  logger: rateLimitLogger,
});

/**
 * Login rate limiter: 10 requests per 15 minutes per IP.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  store: rateLimitStore("login"),
  keyGenerator: ipKey("login"),
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please wait before retrying.",
      details: { retryAfterSeconds: 60 },
    },
  },
  logger: rateLimitLogger,
});

/**
 * Refresh rate limiter: 20 requests per 15 minutes.
 */
export const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: true,
  store: rateLimitStore("refresh"),
  keyGenerator: ipKey("refresh"),
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please wait before retrying.",
      details: { retryAfterSeconds: 60 },
    },
  },
  logger: rateLimitLogger,
});

/**
 * STK Push rate limiter: 5 requests per 5 minutes per booking.
 */
export const stkPushRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // per 5 minutes
  max: 3, // attempts
  standardHeaders: true,
  legacyHeaders: true,
  store: rateLimitStore("stk-push"),
  // body is not validated yet at this point, so fall back to IP when bookingId is missing
  keyGenerator: (req: Request): string => {
    const bookingId: unknown = req.body?.bookingId;
    return typeof bookingId === "string" && bookingId
      ? `stk-push:${bookingId}`
      : ipKey("stk-push")(req);
  },
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please wait before retrying.",
      details: { retryAfterSeconds: 60 },
    },
  },
  logger: rateLimitLogger,
});

/**
 * WhatsApp webhook rate limiter: 500 requests per minute.
 */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: true,
  store: rateLimitStore("webhook"),
  keyGenerator: ipKey("webhook"),
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please wait before retrying.",
      details: { retryAfterSeconds: 60 },
    },
  },
  logger: rateLimitLogger,
});