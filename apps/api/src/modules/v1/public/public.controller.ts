import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { publicService } from "./public.service.js";
import { success, created } from "../../../shared/utils/response.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { ValidationError } from "../../../shared/types/errors.js";
import { redis } from "../../../shared/lib/redis.js";

// --- Validation schemas (exported for use in routes) ---

export const publicAvailabilitySchema = z.object({
  serviceIds: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

export const publicCreateBookingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().min(9).max(16),
  serviceIds: z.array(z.string().uuid()).min(1).max(5),
  appointmentAt: z.iso.datetime(),
  notes: z.string().max(500).optional(),
  // KDPA: customer must agree to WhatsApp notifications before we store their details
  consent: z.literal(true),
});

export const referenceParamSchema = z.object({
  reference: z.string().min(3).max(40),
});

export const phoneQuerySchema = z.object({
  phone: z.string().min(9).max(16),
});

export const publicPaySchema = z.object({
  phone: z.string().min(9).max(16),
  phoneNumber: z.string().min(9).max(16),
});

// --- Handlers ---

export const listServices = asyncHandler(async (_req: Request, res: Response) => {
  success(res, await publicService.listServices());
});

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const input = req.validated!.query as z.infer<typeof publicAvailabilitySchema>;
  success(res, await publicService.getAvailability(input.date, input.serviceIds));
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const input = req.validated!.body as z.infer<typeof publicCreateBookingSchema>;
  created(res, await publicService.createBooking(input));
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const params = req.validated!.params as z.infer<typeof referenceParamSchema>;
  const query = req.validated!.query as z.infer<typeof phoneQuerySchema>;
  success(res, await publicService.getBooking(params.reference, query.phone));
});

export const payBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = req.validated!.params as z.infer<typeof referenceParamSchema>;
    const body = req.validated!.body as z.infer<typeof publicPaySchema>;
    const dedupKey = req.get("idempotency-key");
    if (!dedupKey) {
      return next(new ValidationError("Missing 'Idempotency-Key' header"));
    }

    // Same replay protection as the staff STK push endpoint
    const cacheKey = `cache:public-pay:${dedupKey}`;
    const previous = await redis.get(cacheKey);
    if (previous) {
      return success(res, JSON.parse(previous), 202);
    }

    const result = await publicService.payBooking(params.reference, body.phone, body.phoneNumber);
    await redis.setex(cacheKey, 86_400, JSON.stringify(result));
    success(res, result, 202);
  },
);
