import type { Request, Response, NextFunction } from "express";
import { _config } from "../lib/index.js";
import { ForbiddenError } from "../types/errors.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie sessions with `SameSite=None` (cross-site web + API):
 * state-changing requests that carry an `Origin` must come from an allowed origin.
 * Webhooks are server-to-server and authenticated by signature, so they are exempt.
 */
export const originCheck = (req: Request, _res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  if (SAFE_METHODS.has(req.method) || !origin || req.path.startsWith("/api/v1/webhooks")) {
    next();
    return;
  }

  const allowed = _config.CORS_ORIGIN.split(",").map((o) => o.trim());
  if (!allowed.includes(origin)) {
    next(new ForbiddenError("Origin not allowed"));
    return;
  }
  next();
};
