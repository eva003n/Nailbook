import { Router } from "express";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import {
  publicRateLimit,
  publicBookingRateLimit,
  stkPushRateLimit,
} from "../../../shared/middleware/rateLimit.middleware.js";
import * as publicController from "./public.controller.js";

/**
 * Customer-facing website endpoints. No JWT: access to a booking is checked
 * with its reference + the customer's phone number.
 */
const router: ReturnType<typeof Router> = Router();

router.use(publicRateLimit);

// GET /api/v1/public/services
router.get("/services", publicController.listServices);

// GET /api/v1/public/slots/availability?serviceIds=a,b&date=YYYY-MM-DD
router.get(
  "/slots/availability",
  validate({ query: publicController.publicAvailabilitySchema }),
  publicController.getAvailability,
);

// POST /api/v1/public/bookings
router.post(
  "/bookings",
  publicBookingRateLimit,
  validate(publicController.publicCreateBookingSchema),
  publicController.createBooking,
);

// GET /api/v1/public/bookings/:reference?phone=
router.get(
  "/bookings/:reference",
  validate({
    params: publicController.referenceParamSchema,
    query: publicController.phoneQuerySchema,
  }),
  publicController.getBooking,
);

// POST /api/v1/public/bookings/:reference/pay
router.post(
  "/bookings/:reference/pay",
  stkPushRateLimit,
  validate({
    params: publicController.referenceParamSchema,
    body: publicController.publicPaySchema,
  }),
  publicController.payBooking,
);

export { router as publicRoutes };
