/**
 * Worker config — validates the env vars the background worker process needs.
 *
 * Runs inside Docker, so env vars are injected directly into process.env.
 * In development only, ./.env is loaded via dotenv.
 */

const isDevelopment = (process.env.NODE_ENV || "development") === "development";

if (isDevelopment) {
  const { config } = await import("dotenv");
  config({
    path: "./.env",
  });
}

import { z } from "zod";

const schema = z.object({
  APP_NAME: z.string().default("WannysNails"),
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  // Redis (required for BullMQ + WhatsApp)
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  // WhatsApp (required for sending messages)
  WHATSAPP_ACCESS_TOKEN: z.string().min(1, "WHATSAPP_ACCESS_TOKEN is required"),
  WHATSAPP_PHONE_NUMBER_ID: z
    .string()
    .min(1, "WHATSAPP_PHONE_NUMBER_ID is required"),
  WHATSAPP_API_VERSION: z.string().default("v25.0"),
  // Owner's personal WhatsApp number (E.164), used as a fallback channel for
  // human-escalation alerts when no active Web Push subscription exists.
  OWNER_WHATSAPP_PHONE: z.string().default(""),
  // Database (required for Prisma)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  LOG_LEVEL: z.string().default("info"),
  LOGTAIL_INGESTION_HOST: z.string().default(""),
  LOGTAIL_SOURCE_TOKEN: z.string().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Worker — invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables for worker.");
}

export const _config = parsed.data;
export type Config = z.infer<typeof schema>;
