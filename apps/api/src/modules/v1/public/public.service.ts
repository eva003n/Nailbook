import { servicesService } from "../services/services.service.js";
import { slotsService } from "../slots/slots.service.js";
import { customersService } from "../customers/customers.service.js";
import { bookingsService } from "../bookings/bookings.service.js";
import { paymentsService } from "../payments/payments.service.js";
import { BookingNotFoundError, UnprocessableError } from "../../../shared/types/errors.js";

/**
 * Normalise a Kenyan mobile number to `2547XXXXXXXX` / `2541XXXXXXXX`.
 * Accepts `07…`, `01…`, `+254…`, `254…` or the bare 9 digits; returns null when invalid.
 */
export function normaliseKenyanPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  const phone = `254${digits}`;
  return /^254[17]\d{8}$/.test(phone) ? phone : null;
}

interface PublicBookingView {
  reference: string;
  status: string;
  paymentStatus: string;
  appointmentAt: string;
  durationMinutes: number;
  priceKes: number;
  services: Array<{ name: string }>;
  canPay: boolean;
}

/** Bookings a customer can still pay for from the website. */
const PAYABLE_PAYMENT_STATUSES = new Set(["PENDING", "FAILED", "CANCELLED", "EXPIRED"]);

/**
 * Loads a booking by reference and checks the phone belongs to its customer.
 * A mismatch is reported as "not found" so references cannot be probed.
 */
async function getOwnedBooking(reference: string, phone: string) {
  const normalised = normaliseKenyanPhone(phone);
  const booking = await bookingsService.getByReference(reference).catch(() => null);
  if (!booking || booking.deletedAt || !normalised || booking.customer.phone !== normalised) {
    throw new BookingNotFoundError();
  }
  return booking;
}

export const publicService = {
  async listServices() {
    const services = await servicesService.list(false);
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      priceKes: s.priceKes,
      durationMinutes: s.durationMinutes,
    }));
  },

  async getAvailability(date: string, serviceIds: string) {
    return slotsService.getAvailableSlots(date, serviceIds);
  },

  async createBooking(input: {
    name: string;
    phone: string;
    serviceIds: string[];
    appointmentAt: string;
    notes?: string | undefined;
  }) {
    const phone = normaliseKenyanPhone(input.phone);
    if (!phone) {
      throw new UnprocessableError("INVALID_PHONE", "Enter a valid Kenyan mobile number");
    }
    if (Date.parse(input.appointmentAt) < Date.now()) {
      throw new UnprocessableError("INVALID_APPOINTMENT_AT", "appointmentAt value must be in the future");
    }

    const customer = await customersService.findOrCreate(phone, input.name.trim());
    const booking = await bookingsService.create({
      customerId: customer.id,
      serviceIds: input.serviceIds,
      appointmentAt: input.appointmentAt,
      notes: input.notes,
      stylist: undefined,
      actorType: "CUSTOMER",
    });

    return {
      reference: booking.reference,
      status: booking.status,
      appointmentAt: booking.appointmentAt,
      durationMinutes: booking.durationMinutes,
      priceKes: booking.priceKes,
      services: booking.services.map((s) => ({ name: s.service.name })),
    };
  },

  async getBooking(reference: string, phone: string): Promise<PublicBookingView> {
    const booking = await getOwnedBooking(reference, phone);
    const paymentStatus = booking.payment?.status ?? booking.paymentStatus;
    return {
      reference: booking.reference,
      status: booking.status,
      paymentStatus,
      appointmentAt: booking.appointmentAt.toISOString(),
      durationMinutes: booking.durationMinutes,
      priceKes: booking.priceKes,
      services: booking.services.map((s) => ({ name: s.service.name })),
      canPay: booking.status === "APPROVED" && PAYABLE_PAYMENT_STATUSES.has(paymentStatus),
    };
  },

  async payBooking(reference: string, phone: string, payerPhone: string) {
    const booking = await getOwnedBooking(reference, phone);
    const mpesaPhone = normaliseKenyanPhone(payerPhone);
    if (!mpesaPhone) {
      throw new UnprocessableError("INVALID_PHONE", "Enter a valid M-Pesa number");
    }
    await paymentsService.initiateStkPush(booking.id, mpesaPhone, null);
    // Only what the website needs; payment ids stay internal.
    return { status: "PENDING" as const, amountKes: booking.priceKes };
  },
};
