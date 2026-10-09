import type { PrismaClient } from "@nailbook/core";

declare global {
    var prisma: PrismaClient | undefined
}