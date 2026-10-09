import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session"

// Middlewares
import { errorMiddleware } from "./shared/middleware/error.middleware.js";
import { requestIdMiddleware } from "./shared/middleware/requestId.middleware.js";
import { globalRateLimit } from "./shared/middleware/rateLimit.middleware.js";
import { originCheck } from "./shared/middleware/originCheck.middleware.js";

// Routes
import { v1Routes } from "./modules/v1/router.js";
import { logMiddleware } from "./shared/middleware/log.middleware.js";
import { _config, sessionStore } from "./shared/lib/index.js";
import { notFound } from "./shared/middleware/404.middleware.js";
import { groupedBoard } from "./shared/lib/index.js";

/**
 * Create the Express application.
 *
 * Kept as a factory (per TESTING.md) so Supertest can run the app
 * entirely in-process without binding to a port. The production entry
 * (g`index.ts`) is responsible for creating the HTTP server and listening.
 */
export function createApp() {
  const app = express();
  const SESSION_KEY = "session";

  // express app is behind a proxy(trust first proxy hoop)
  app.set("trust proxy", 1);
  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: _config.CORS_ORIGIN.split(","),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    }),
  );

  // parse cookie
  app.use(cookieParser(_config.COOKIE_SECRET.split(",")));

  // Raw body for webhook signature verification
  app.use(
    express.json({
      limit: "16kb",
      verify: (req, _res, buf) => {
        (req as unknown as Record<string, unknown>).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  // serve static assets
  app.use(express.static("public"));
  // X-Request-ID middleware (runs on every request)
  app.use(requestIdMiddleware);

  // Global rate limiter
  app.use(globalRateLimit);

  // HTTP request logging
  app.use(logMiddleware);

  // session management
  app.use(
    session({
      name: "sid",
      secret: _config.COOKIE_SECRET?.split(","),
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        path: "/",
        httpOnly: true,
        secure: _config.NODE_ENV === "production",
        // Production web (Vercel) and API are on different sites, so "strict" would drop the cookie.
        // CSRF is covered by the CORS allow-list + originCheck middleware.
        sameSite: _config.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 60 * 1000, // 30 minutes
      },
    }),
  );
  // check origin header
  app.use(originCheck);

  // Bull mq queues UI
  app.use("/api/v1/admin/queues", groupedBoard.getRouter());

  // v1 API routes (health, webhooks, and all authenticated routes)
  app.use("/api/v1", v1Routes);

  app.use(notFound);
  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}

export default createApp;