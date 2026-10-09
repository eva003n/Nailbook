/**
 * PM2 ecosystem config — Nailbook
 *
 * Run with:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env development
 *
 * Useful commands:
 *   pm2 status
 *   pm2 logs api
 *   pm2 logs worker --lines 200
 *   pm2 restart worker
 *   pm2 reload api          (zero-downtime, only meaningful in cluster mode)
 *   pm2 save && pm2 startup (persist across server reboots)
 *
 * Notes:
 * - The `worker` app runs the conversation, payment and notification BullMQ
 *   workers in one process, in `fork` mode with instances: 1. Do NOT switch
 *   it to cluster mode unless every processor is verified idempotent —
 *   cluster mode means multiple processes pulling from the same queue
 *   concurrently, which defeats jobId-based dedup assumptions.
 * - The API runs in fork mode by default. If you move to a multi-core box
 *   and want to scale it, change `exec_mode` to 'cluster' and `instances`
 *   to a number (or 'max') for the `api` app only — leave workers alone.
 * - Each app loads its own env file, matching the per-app env schema split
 *   already in place (apps/api and apps/worker each have their own .env).
 */

module.exports = {
  apps: [
    {
      name: "api",
      cwd: "./apps/api",
      script: "dist/index.js", // adjust if your build output differs
      exec_mode: "fork", // change to 'cluster' + instances > 1 only for this app, if/when scaling
      instances: 1,
      env_file: "./apps/api/.env.development",
      watch: true,
      max_memory_restart: "500M",
      autorestart: true,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000, // give in-flight requests time to finish on stop/restart
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },

    {
      name: "worker",
      cwd: "./apps/worker",
      script: "dist/index.js",
      exec_mode: "fork",
      instances: 1, // single process — consumes the conversations, payments and notifications queues
      env_file: "./apps/worker/.env",
      watch: true,
      max_memory_restart: "600M",
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 30000, // lets the worker drain in-flight jobs (its own shutdown cap is 25s) before SIGKILL
      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
