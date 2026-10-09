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
