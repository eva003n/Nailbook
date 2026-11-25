import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  clearAll,
  createBooking,
  createBusinessHours,
  createCustomer,
  createService,
  createTestApp,
  createUser,
} from "../../../../test/helpers.js";

describe("public routes — integration", () => {
  beforeEach(async () => {
    await clearAll();
    await createUser();
    await createBusinessHours();
  });

  const app = createTestApp();

  describe("GET /api/v1/public/services", () => {
    it("lists active services without auth", async () => {
      await createService();
      const res = await request(app).get("/api/v1/public/services");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({ name: "Classic Manicure", priceKes: 1500, durationMinutes: 60 }),
      );
      // internal fields stay private
      expect(res.body.data[0]).not.toHaveProperty("metadata");
      expect(res.body.data[0]).not.toHaveProperty("isActive");
    });
  });

  describe("GET /api/v1/public/slots/availability", () => {
    it("returns slots without auth", async () => {
      const service = await createService();
      const dateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const res = await request(app).get(
        `/api/v1/public/slots/availability?serviceIds=${service.id}&date=${dateStr}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.slots.length).toBeGreaterThan(0);
    });

    it("rejects a malformed date with 400", async () => {
      const service = await createService();
      const res = await request(app).get(
        `/api/v1/public/slots/availability?serviceIds=${service.id}&date=tomorrow`,
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/public/bookings", () => {
    const tomorrowAt10 = () => {
      const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
      start.setUTCHours(10, 0, 0, 0);
      return start.toISOString();
    };

    it("creates a PENDING booking and a customer from a local phone number", async () => {
      const service = await createService();

      const res = await request(app).post("/api/v1/public/bookings").send({
        name: "Amina Wanjiru",
        phone: "0722 000 111",
        serviceIds: [service.id],
        appointmentAt: tomorrowAt10(),
        consent: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.reference).toBeTruthy();
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.priceKes).toBe(1500);
      expect(res.body.data).not.toHaveProperty("customer");
      expect(res.body.data).not.toHaveProperty("id");

      const { prisma } = await import("../../../shared/lib/prisma.js");
      const customer = await prisma.customer.findUnique({ where: { phone: "254722000111" } });
      expect(customer?.name).toBe("Amina Wanjiru");
    });

    it("requires consent", async () => {
      const service = await createService();
      const res = await request(app).post("/api/v1/public/bookings").send({
        name: "Amina Wanjiru",
        phone: "0722000111",
        serviceIds: [service.id],
        appointmentAt: tomorrowAt10(),
        consent: false,
      });
      expect(res.status).toBe(400);
    });

    it("rejects an invalid phone number with 422", async () => {
      const service = await createService();
      const res = await request(app).post("/api/v1/public/bookings").send({
        name: "Amina Wanjiru",
        phone: "0822000111",
        serviceIds: [service.id],
        appointmentAt: tomorrowAt10(),
        consent: true,
      });
      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/v1/public/bookings/:reference", () => {
    it("returns the booking when the phone matches", async () => {
      const customer = await createCustomer();
      const service = await createService();
      const booking = await createBooking({ customerId: customer.id, serviceId: service.id, status: "APPROVED" });

      const res = await request(app).get(
        `/api/v1/public/bookings/${booking.reference}?phone=0712345678`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.reference).toBe(booking.reference);
      expect(res.body.data.canPay).toBe(true);
      expect(res.body.data).not.toHaveProperty("customer");
    });

    it("returns 404 when the phone does not match", async () => {
      const customer = await createCustomer();
      const service = await createService();
      const booking = await createBooking({ customerId: customer.id, serviceId: service.id });

      const res = await request(app).get(
        `/api/v1/public/bookings/${booking.reference}?phone=0799999999`,
      );
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/public/bookings/:reference/pay", () => {
    it("queues an STK push for an approved booking", async () => {
      const customer = await createCustomer();
      const service = await createService();
      const booking = await createBooking({ customerId: customer.id, serviceId: service.id, status: "APPROVED" });

      const res = await request(app)
        .post(`/api/v1/public/bookings/${booking.reference}/pay`)
        .set("Idempotency-Key", "public-pay-test-1")
        .send({ phone: "0712345678", phoneNumber: "0712345678" });

      expect(res.status).toBe(202);
      expect(res.body.data).toEqual({ status: "PENDING", amountKes: 1500 });
    });

    it("refuses payment before the booking is approved", async () => {
      const customer = await createCustomer();
      const service = await createService();
      const booking = await createBooking({ customerId: customer.id, serviceId: service.id });

      const res = await request(app)
        .post(`/api/v1/public/bookings/${booking.reference}/pay`)
        .set("Idempotency-Key", "public-pay-test-2")
        .send({ phone: "0712345678", phoneNumber: "0712345678" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("PAYMENT_NOT_ALLOWED");
    });

    it("requires an Idempotency-Key header", async () => {
      const customer = await createCustomer();
      const service = await createService();
      const booking = await createBooking({ customerId: customer.id, serviceId: service.id, status: "APPROVED" });

      const res = await request(app)
        .post(`/api/v1/public/bookings/${booking.reference}/pay`)
        .send({ phone: "0712345678", phoneNumber: "0712345678" });
      expect(res.status).toBe(400);
    });
  });
});
