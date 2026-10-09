import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { _config } from "../lib/index.js";
import { UnauthorizedError, ForbiddenError } from "../types/errors.js";
import { rescheduleBooking } from "../../modules/v1/bookings/bookings.controller.js";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extract a JWT from the request.
 *
 * The token is resolved from, in order of priority:
 * 1. A signed HTTP-only cookie (`accessToken`) — preferred for browser clients.
 * 2. The `Authorization: Bearer <token>` header — used by APIs, mobile apps, and
 *    external clients (e.g. EventSource which cannot set custom headers).
 *
 * Controllers and services must never parse cookies or headers directly — this
 * centralised helper is the single source of truth for auth extraction.
 */

const ABSOLUTE_LIFE_TIME = 12 * 60 * 60 * 1000;
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    next(new UnauthorizedError());
    return;
  }

  if (
    req.session.authenticatedAt &&
    Date.now() - req.session.authenticatedAt >= ABSOLUTE_LIFE_TIME
  ) {
    req.session.destroy((err) => {
      if (err) return next(err);
      next(new UnauthorizedError());
      return;
    });
  }

  req.user = {
    role: req.session.role as "OWNER" | "STAFF",
    userId: req.session.userId as string,
  };
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }
    next();
  };
};
