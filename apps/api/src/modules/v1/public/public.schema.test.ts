import { describe, expect, it } from "vitest";
import { normaliseKenyanPhone } from "./public.service.js";
import { publicCreateBookingSchema } from "./public.controller.js";

describe("normaliseKenyanPhone", () => {
  it.each([
    ["0712345678", "254712345678"],
    ["0112345678", "254112345678"],
    ["+254 712 345 678", "254712345678"],
    ["254712345678", "254712345678"],
    ["712345678", "254712345678"],
  ])("normalises %s", (input, expected) => {
    expect(normaliseKenyanPhone(input)).toBe(expected);
  });

  it.each(["0812345678", "07123", "2547123456789", "hello"])("rejects %s", (input) => {
    expect(normaliseKenyanPhone(input)).toBeNull();
  });
});

describe("publicCreateBookingSchema", () => {
  const valid = {
    name: "Amina",
    phone: "0712345678",
    serviceIds: ["3f0c5b2d-1a9e-4d8f-9c6e-2b7a1f3d5c8e"],
    appointmentAt: "2030-01-01T10:00:00.000Z",
    consent: true,
  };

  it("accepts a valid booking", () => {
    expect(publicCreateBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing consent", () => {
    expect(publicCreateBookingSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("rejects an empty service list", () => {
    expect(publicCreateBookingSchema.safeParse({ ...valid, serviceIds: [] }).success).toBe(false);
  });
});
