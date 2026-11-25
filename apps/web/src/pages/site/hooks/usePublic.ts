import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { validateOrThrow } from "@/lib/guards";
import {
  AvailableSlotsResponseSchema,
  PublicBookingCreatedSchema,
  PublicBookingSchema,
  PublicServiceSchema,
  type PublicBooking,
} from "@/lib/schemas";

export const publicKeys = {
  services: ["public", "services"] as const,
  slots: (date: string, serviceIds: string) => ["public", "slots", date, serviceIds] as const,
  booking: (reference: string, phone: string) => ["public", "booking", reference, phone] as const,
};

/** Active services with prices, for the Home, Services and Book pages. */
export function usePublicServices() {
  return useQuery({
    queryKey: publicKeys.services,
    queryFn: async () => {
      const res = await api.get("/public/services");
      return validateOrThrow(z.array(PublicServiceSchema), res.data.data, "public services");
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Open start times for the chosen services on one day. */
export function usePublicSlots(date: string, serviceIds: string[]) {
  const ids = serviceIds.join(",");
  return useQuery({
    queryKey: publicKeys.slots(date, ids),
    queryFn: async () => {
      const res = await api.get("/public/slots/availability", { params: { date, serviceIds: ids } });
      return validateOrThrow(AvailableSlotsResponseSchema, res.data.data, "public slots");
    },
    enabled: Boolean(date) && serviceIds.length > 0,
    staleTime: 30 * 1000,
  });
}

export interface PublicBookingInput {
  name: string;
  phone: string;
  serviceIds: string[];
  appointmentAt: string;
  notes?: string;
  consent: true;
}

export function useCreatePublicBooking() {
  return useMutation({
    mutationFn: async (input: PublicBookingInput) => {
      const res = await api.post("/public/bookings", input);
      return validateOrThrow(PublicBookingCreatedSchema, res.data.data, "public booking");
    },
  });
}

/**
 * Booking status by reference + phone. While a payment is in flight it polls
 * every 5 s so the page flips to "Paid" once the M-Pesa callback lands.
 */
export function usePublicBooking(reference: string, phone: string, polling: boolean) {
  return useQuery({
    queryKey: publicKeys.booking(reference, phone),
    queryFn: async (): Promise<PublicBooking> => {
      const res = await api.get(`/public/bookings/${encodeURIComponent(reference)}`, { params: { phone } });
      return validateOrThrow(PublicBookingSchema, res.data.data, "public booking status");
    },
    enabled: Boolean(reference && phone),
    retry: false,
    refetchInterval: polling ? 5000 : false,
  });
}

export function usePayPublicBooking() {
  return useMutation({
    mutationFn: async (input: { reference: string; phone: string; phoneNumber: string }) => {
      const res = await api.post(
        `/public/bookings/${encodeURIComponent(input.reference)}/pay`,
        { phone: input.phone, phoneNumber: input.phoneNumber },
        // a fresh key per attempt: a resend is a new STK push, a network retry of one attempt is not
        { headers: { "Idempotency-Key": crypto.randomUUID() } },
      );
      return res.data.data as { status: "PENDING"; amountKes: number };
    },
  });
}

/** Pull the API's human message out of an axios error, if there is one. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
  return typeof message === "string" && message ? message : fallback;
}
