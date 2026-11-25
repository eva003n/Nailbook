import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clsx } from "clsx";
import { Check, Clock, Smartphone, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatDate, formatKes, formatTime } from "@/lib/format";
import type { PublicBooking } from "@/lib/schemas";
import { SiteButtonLink, SiteContainer } from "@/components/site/SiteLayout";
import { apiErrorMessage, usePayPublicBooking, usePublicBooking } from "./hooks/usePublic";
import { SALON } from "./siteContent";

const STATUS_LABEL: Record<string, { label: string; tone: "warning" | "info" | "success" | "error" }> = {
  PENDING: { label: "Awaiting approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "info" },
  RESCHEDULED: { label: "Rescheduled", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "error" },
  NO_SHOW: { label: "Missed", tone: "error" },
};

const TONE_CLASSES = {
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  error: "bg-error-bg text-error",
};

const FAILED_PAYMENT = new Set(["FAILED", "CANCELLED", "EXPIRED"]);
/** Stop polling if M-Pesa hasn't answered after two minutes. */
const PAYMENT_TIMEOUT_MS = 120_000;

/** 9 national digits from whatever the customer typed. */
function nationalDigits(value: string): string {
  let v = value.replace(/\D/g, "");
  if (v.startsWith("254") && v.length > 9) v = v.slice(3);
  if (v.startsWith("0")) v = v.slice(1);
  return v.slice(0, 9);
}

function PhoneField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className="flex overflow-hidden rounded-(--radius-md) border border-border-strong bg-surface focus-within:border-plum">
        <span className="flex items-center border-r border-border-strong bg-surface-raised px-3.5 font-semibold text-ink-2">+254</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="712 345 678"
          value={value}
          onChange={(e) => onChange(nationalDigits(e.target.value))}
          className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-base outline-none"
        />
      </div>
    </div>
  );
}

function PaymentPanel({
  booking,
  phone,
  onStarted,
}: {
  booking: PublicBooking;
  phone: string;
  onStarted: () => void;
}) {
  const pay = usePayPublicBooking();
  const [payer, setPayer] = useState(phone);

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-paper p-5">
      <h2 className="text-lg font-bold">Pay with M‑Pesa</h2>
      <p className="text-[0.9375rem] leading-normal text-ink-2">
        We'll send a payment prompt for <strong className="text-ink">{formatKes(booking.priceKes)}</strong> to this number.
      </p>
      <PhoneField id="pay-phone" label="M‑Pesa number" value={payer} onChange={setPayer} />
      {pay.isError && (
        <p role="alert" className="rounded-xl bg-error-bg px-4 py-3 text-[0.9375rem] font-semibold text-error">
          {apiErrorMessage(pay.error, "We couldn't send the prompt. Please try again.")}
        </p>
      )}
      <Button
        size="lg"
        className="rounded-full"
        disabled={payer.length !== 9}
        loading={pay.isPending}
        onClick={() =>
          pay.mutate(
            { reference: booking.reference, phone: `254${phone}`, phoneNumber: `254${payer}` },
            { onSuccess: onStarted },
          )
        }
      >
        Pay {formatKes(booking.priceKes)}
      </Button>
    </div>
  );
}

function WaitingForPayment({ phone, timedOut, onResend }: { phone: string; timedOut: boolean; onResend: () => void }) {
  return (
    <div aria-live="polite" className="flex flex-col items-center gap-4 rounded-[20px] border border-line bg-paper p-6 text-center">
      <span aria-hidden="true" className="flex h-18 w-18 items-center justify-center rounded-full bg-success-bg text-success">
        <Smartphone size={34} />
      </span>
      <h2 className="font-display text-2xl font-bold">Check your phone</h2>
      <p className="leading-relaxed text-ink-2">
        We've sent an M‑Pesa prompt to <strong className="text-ink">+254 {phone}</strong>. Enter your M‑Pesa PIN to finish.
      </p>
      <p className="flex items-center gap-2.5 rounded-full bg-surface-raised px-4 py-2.5 text-[0.9375rem] font-semibold text-ink-2">
        {timedOut ? "Still nothing? It may have expired." : "Waiting for M‑Pesa confirmation…"}
      </p>
      <button type="button" onClick={onResend} className="min-h-11 px-3 font-semibold text-plum-deep underline">
        Didn't get it? Send the prompt again
      </button>
    </div>
  );
}

function BookingDetails({ lookup, onReset }: { lookup: { reference: string; phone: string }; onReset: () => void }) {
  const [paying, setPaying] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const query = usePublicBooking(lookup.reference, `254${lookup.phone}`, paying);
  const booking = query.data;

  const startPolling = () => {
    setPaying(true);
    setTimedOut(false);
  };

  // stop polling once M-Pesa answers, or give up after the timeout
  useEffect(() => {
    if (!paying || !booking) return;
    if (booking.paymentStatus === "SUCCESS" || FAILED_PAYMENT.has(booking.paymentStatus)) setPaying(false);
  }, [paying, booking]);
  useEffect(() => {
    if (!paying) return;
    const t = window.setTimeout(() => {
      setPaying(false);
      setTimedOut(true);
    }, PAYMENT_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [paying]);

  if (query.isLoading) {
    return <div className="h-80 animate-pulse rounded-[28px] bg-petal" aria-label="Loading your booking" role="status" />;
  }

  if (query.isError || !booking) {
    return (
      <div role="alert" className="flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-8">
        <h2 className="text-xl font-bold">We couldn't find that booking</h2>
        <p className="text-ink-2">Check the reference from your WhatsApp message and use the phone number you booked with.</p>
        <Button variant="secondary" fullWidth={false} className="self-start rounded-full" onClick={onReset}>
          Try again
        </Button>
      </div>
    );
  }

  const status = STATUS_LABEL[booking.status] ?? { label: booking.status, tone: "info" as const };
  const paid = booking.paymentStatus === "SUCCESS";
  const paymentFailed = FAILED_PAYMENT.has(booking.paymentStatus);

  return (
    <section aria-labelledby="booking-h" className="flex flex-col gap-6 rounded-[28px] border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="booking-h" className="text-sm text-ink-2">
          Reference <strong className="text-lg tracking-[0.06em] text-ink">{booking.reference}</strong>
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className={clsx("rounded-full px-2.5 py-1 text-[0.8125rem] font-bold", TONE_CLASSES[status.tone])}>
            {status.label}
          </span>
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.8125rem] font-bold",
              paid ? TONE_CLASSES.success : "bg-surface-raised text-ink-2",
            )}
          >
            {paid ? <Check size={14} aria-hidden="true" /> : null}
            {paid ? "Paid" : "Not paid yet"}
          </span>
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-[0.9375rem]">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <dt className="text-ink-2">Services</dt>
          <dd className="text-right font-semibold">{booking.services.map((s) => s.name).join(", ")}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <dt className="text-ink-2">When</dt>
          <dd className="text-right font-semibold">
            {formatDate(booking.appointmentAt)} · {formatTime(booking.appointmentAt)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <dt className="text-ink-2">Total</dt>
          <dd className="font-semibold">{formatKes(booking.priceKes)}</dd>
        </div>
      </dl>

      {booking.status === "PENDING" && (
        <p className="flex gap-3 rounded-2xl bg-info-bg px-5 py-4 text-[0.9375rem] leading-normal text-info">
          <Clock size={20} className="shrink-0" aria-hidden="true" />
          The studio is reviewing your request. We'll message you on WhatsApp when it's approved, and you can pay here then.
        </p>
      )}

      {paid && (
        <p className="flex gap-3 rounded-2xl bg-success-bg px-5 py-4 font-semibold text-success">
          <Check size={20} className="shrink-0" aria-hidden="true" />
          Payment received — see you soon!
        </p>
      )}

      {paymentFailed && !paying && (
        <p role="alert" className="flex gap-3 rounded-2xl bg-error-bg px-5 py-4 font-semibold text-error">
          <X size={20} className="shrink-0" aria-hidden="true" />
          The last payment didn't go through. You can try again below.
        </p>
      )}

      {paying || timedOut ? (
        <WaitingForPayment
          phone={lookup.phone}
          timedOut={timedOut}
          onResend={() => {
            setPaying(false);
            setTimedOut(false);
          }}
        />
      ) : (
        booking.canPay && <PaymentPanel booking={booking} phone={lookup.phone} onStarted={startPolling} />
      )}

      <p className="text-sm text-ink-2">
        Need to reschedule or cancel?{" "}
        <a href={SALON.whatsappUrl} className="font-semibold text-plum-deep underline">
          Message us on WhatsApp
        </a>{" "}
        with your reference.
      </p>
    </section>
  );
}

export function MyBookingPage() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<{ reference: string; phone: string } | null>(null);

  return (
    <SiteContainer className="flex flex-wrap items-start gap-12 pt-18 pb-24">
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] leading-[1.04] font-bold tracking-[-0.035em]">
            My booking
          </h1>
          <p className="text-lg leading-relaxed text-ink-2">
            Check whether your booking is approved, and pay with M‑Pesa once it is.
          </p>
        </div>
        <form
          className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setLookup({ reference: reference.trim().toUpperCase(), phone });
          }}
        >
          <Input
            label="Booking reference"
            id="lookup-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="From your WhatsApp message"
            autoCapitalize="characters"
          />
          <PhoneField id="lookup-phone" label="Phone number you booked with" value={phone} onChange={setPhone} />
          <Button type="submit" size="lg" className="rounded-full" disabled={reference.trim().length < 3 || phone.length !== 9}>
            Find my booking
          </Button>
        </form>
        <p className="text-sm text-ink-2">
          Haven't booked yet? <SiteButtonLink to="/book" variant="secondary" className="ml-1">Book now</SiteButtonLink>
        </p>
      </div>

      <div className="min-w-0 flex-[1_1_440px]">
        {lookup ? (
          <BookingDetails key={`${lookup.reference}-${lookup.phone}`} lookup={lookup} onReset={() => setLookup(null)} />
        ) : (
          <img
            src="/images/site/technician-at-work.jpg"
            alt="Nail technician shaping a client's gel nails"
            width={1200}
            height={800}
            loading="lazy"
            className="hidden aspect-4/3 w-full rounded-[28px] object-cover md:block"
          />
        )}
      </div>
    </SiteContainer>
  );
}
