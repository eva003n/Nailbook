import { createPrismaClient} from "@wannys-nails/core";
import { _config } from "./config.js";
import { log } from "./logger.js";

export const prisma = createPrismaClient(
  _config.DATABASE_URL,
  _config.NODE_ENV,
);

try {
  await prisma.$connect();
  log.info(
    {
      event: "Postgres.connection.success",
    },
    "Connected to the database",
  );
} catch (err: unknown) {
  log.error(
    {
      event: "Postgres.connection.failed",
      error: err instanceof Error ? err.message : String(err),
    },
    "Failed to connect to the database",
  );
}

export { type BookingModel as Booking, type Prisma } from "@wannys-nails/core";
