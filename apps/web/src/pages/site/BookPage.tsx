import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { clsx } from "clsx";
import { Check, ChevronLeft, CircleCheck, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import NailSwatch from "@/components/ui/NailSwatch";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate, formatKes, formatTime } from "@/lib/format";
import type { PublicBookingCreated, PublicService } from "@/lib/schemas";
import { DateStrip, SlotGrid, StepIndicator } from "@/pages/bookings/components/SlotPicker";
import { nextDays } from "@/pages/bookings/components/dateOptions";
import { SiteButtonLink, SiteContainer } from "@/components/site/SiteLayout";
import { apiErrorMessage, useCreatePublicBooking, usePublicServices, usePublicSlots } from "./hooks/usePublic";
import { CATEGORY_ORDER, SALON, categoryContent } from "./siteContent";

const STEP_LABELS = ["Services", "Date & time", "Your details", "Review"];
const DAYS = nextDays(14);

function formatMinutes(total: number): string {
  if (total === 0) return "—";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return [h ? `${h} hr${h > 1 ? "s" : ""}` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

function StepHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 id={id} className="font-display text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.1] font-bold tracking-[-0.03em]">
        {title}
      </h1>
      <p className="text-[1.0625rem] text-ink-2">{subtitle}</p>
    </div>
  );
}

function ServiceStep({
  services,
  selected,
  onToggle,
}: {
  services: PublicService[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, PublicService[]>();
    for (const s of services) map.set(s.category, [...(map.get(s.category) ?? []), s]);
    const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
    return [...map.entries()].sort(([a], [b]) => rank(a) - rank(b));
  }, [services]);

  return (
    <section aria-labelledby="step-services" className="flex flex-col gap-7">
      <StepHeading id="step-services" title="What are we doing today?" subtitle="Choose one or more services." />
      {groups.map(([category, items]) => {
        const c = categoryContent(category);
        return (
          <div key={category} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2.5 text-[1.0625rem] font-bold">
              <NailSwatch color={c.color} width={12} height={20} />
              {c.label}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {items.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggle(s.id)}
                    className={clsx(
                      "flex min-h-23 flex-col justify-between gap-2.5 rounded-2xl border-2 px-4.5 py-4 text-left transition-colors",
                      on ? "border-plum-strong bg-petal" : "border-line bg-surface hover:border-mauve",
                    )}
                  >
                    <span className="flex w-full items-start justify-between gap-3">
                      <span className="leading-snug font-bold">{s.name}</span>
                      <span
                        aria-hidden="true"
                        className={clsx(
                          "flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-[7px] border-[1.5px]",
                          on ? "border-plum-strong bg-plum-strong text-white" : "border-border-strong bg-surface text-transparent",
                        )}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                    </span>
                    <span className="text-[0.9375rem] text-ink-2">
                      <strong className="text-ink">{formatKes(s.priceKes)}</strong> · {formatMinutes(s.durationMinutes)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TimeStep({
  serviceIds,
  date,
  onDate,
  appointmentAt,
  onTime,
  duration,
}: {
  serviceIds: string[];
  date: string;
  onDate: (iso: string) => void;
  appointmentAt: string | null;
  onTime: (iso: string) => void;
  duration: number;
}) {
  const slots = usePublicSlots(date, serviceIds);
  return (
    <section aria-labelledby="step-time" className="flex flex-col gap-7">
      <StepHeading
        id="step-time"
        title="Pick a day and time"
        subtitle={`Showing start times that fit your ${formatMinutes(duration)} appointment. Closed Sundays.`}
      />
      <div className="flex flex-col gap-3">
        <h2 className="text-[1.0625rem] font-bold">Day</h2>
        <DateStrip days={DAYS} value={date} onChange={onDate} />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-[1.0625rem] font-bold">Start time</h2>
        {slots.isError ? (
          <p className="rounded-(--radius-md) bg-paper px-4 py-3 text-ink-2">
            {apiErrorMessage(slots.error, "We couldn't load times for this day.")} Try another day.
          </p>
        ) : (
          <SlotGrid
            slots={slots.data?.slots ?? []}
            value={appointmentAt}
            onChange={onTime}
            loading={slots.isLoading}
          />
        )}
        <p className="text-sm text-ink-2">Crossed‑out times are already booked.</p>
      </div>
    </section>
  );
}

function DetailsStep({
  name,
  phone,
  notes,
  consent,
  onChange,
}: {
  name: string;
  phone: string;
  notes: string;
  consent: boolean;
  onChange: (patch: Partial<{ name: string; phone: string; notes: string; consent: boolean }>) => void;
}) {
  return (
    <section aria-labelledby="step-details" className="flex max-w-136 flex-col gap-6">
      <StepHeading id="step-details" title="Your details" subtitle="We'll send your confirmation and reminder to this number." />
      <Input
        label="Full name"
        id="book-name"
        autoComplete="name"
        value={name}
        placeholder="e.g. Amina Wanjiru"
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="book-phone" className="text-sm font-semibold">
          Phone number (WhatsApp &amp; M‑Pesa)
        </label>
        <div className="flex overflow-hidden rounded-(--radius-md) border border-border-strong bg-surface focus-within:border-plum">
          <span className="flex items-center border-r border-border-strong bg-surface-raised px-3.5 font-semibold text-ink-2">+254</span>
          <input
            id="book-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="712 345 678"
            aria-describedby="book-phone-hint"
            value={phone}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "");
              if (v.startsWith("254") && v.length > 9) v = v.slice(3);
              if (v.startsWith("0")) v = v.slice(1);
              onChange({ phone: v.slice(0, 9) });
            }}
            className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-base outline-none"
          />
        </div>
        <span id="book-phone-hint" className="text-sm text-ink-2">
          We'll use this number for WhatsApp updates and the M‑Pesa payment prompt.
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="book-notes" className="text-sm font-semibold">
          Anything we should know? <span className="font-normal text-ink-2">(optional)</span>
        </label>
        <textarea
          id="book-notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Colour ideas, nail length, allergies…"
          className="rounded-(--radius-md) border border-border-strong bg-surface px-4 py-3 text-base outline-none focus:border-plum"
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
          className="mt-0.5 h-5.5 w-5.5 shrink-0 accent-(--color-plum-strong)"
        />
        <span className="text-[0.9375rem] leading-normal">
          Send my booking updates and reminders on WhatsApp. My details are only used for my appointments, in line with
          the Kenya Data Protection Act.
        </span>
      </label>
    </section>
  );
}

function ReviewStep({
  services,
  appointmentAt,
  name,
  phone,
  notes,
  error,
  onEditDetails,
}: {
  services: PublicService[];
  appointmentAt: string;
  name: string;
  phone: string;
  notes: string;
  error: string | null;
  onEditDetails: () => void;
}) {
  const rows: Array<[string, string]> = [
    ["Services", services.map((s) => s.name).join(", ")],
    ["When", `${formatDate(appointmentAt)} · ${formatTime(appointmentAt)}`],
    ["Name", name],
    ["Phone", `+254 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`],
  ];
  if (notes) rows.push(["Notes", notes]);

  return (
    <section aria-labelledby="step-review" className="flex flex-col gap-6">
      <StepHeading id="step-review" title="Check everything looks right" subtitle="Then send your booking request to the studio." />
      <dl className="rounded-[20px] border border-line bg-surface px-6 py-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-divider py-4 last:border-b-0">
            <dt className="text-ink-2">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onEditDetails} className="self-start py-2 font-semibold text-plum-deep underline">
        Change my details
      </button>
      <div className="flex gap-3.5 rounded-2xl bg-info-bg px-5 py-4.5 text-info">
        <Clock size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[0.9375rem] leading-normal">
          <strong>What happens next:</strong> the studio reviews your request and confirms on WhatsApp. Once approved you can
          pay with M‑Pesa from the My booking page, or pay at the studio.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-error-bg px-5 py-4 font-semibold text-error">
          {error}
        </p>
      )}
    </section>
  );
}

function DoneView({ booking }: { booking: PublicBookingCreated }) {
  return (
    <section aria-labelledby="done" className="mx-auto mt-6 flex w-full max-w-144 flex-col gap-6 rounded-[28px] border border-line bg-surface p-8 sm:p-10">
      <div className="flex flex-col items-center gap-3.5 text-center">
        <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-plum-strong text-white">
          <Check size={38} strokeWidth={2.6} />
        </span>
        <h1 id="done" className="font-display text-[2rem] font-bold tracking-[-0.03em]">
          Request received!
        </h1>
        <p className="text-[1.0625rem] leading-relaxed text-ink-2">
          We'll confirm your appointment on WhatsApp as soon as the studio approves it.
        </p>
      </div>
      <div className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink-2">
            Reference <strong className="text-lg tracking-[0.06em] text-ink">{booking.reference}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-[0.8125rem] font-bold text-warning">
            <Clock size={14} aria-hidden="true" />
            Awaiting approval
          </span>
        </div>
        <dl className="flex flex-col gap-2 text-[0.9375rem]">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">Services</dt>
            <dd className="text-right font-semibold">{booking.services.map((s) => s.name).join(", ")}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">When</dt>
            <dd className="text-right font-semibold">
              {formatDate(booking.appointmentAt)} · {formatTime(booking.appointmentAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">Total</dt>
            <dd className="font-semibold">{formatKes(booking.priceKes)}</dd>
          </div>
        </dl>
      </div>
      <p className="text-center text-sm text-ink-2">Save your reference — you'll need it to check your booking or pay.</p>
      <div className="flex flex-wrap gap-2.5">
        <SiteButtonLink to={`/my-booking?ref=${encodeURIComponent(booking.reference)}`} className="flex-[1_1_180px]">
          Check my booking
        </SiteButtonLink>
        <SiteButtonLink to="/" variant="secondary" className="flex-[1_1_180px]">
          Back to home
        </SiteButtonLink>
      </div>
    </section>
  );
}

export function BookPage() {
  const [params] = useSearchParams();
  const services = usePublicServices();
  const create = useCreatePublicBooking();

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(() => {
    const preset = params.get("service");
    return preset ? [preset] : [];
  });
  const [date, setDate] = useState(DAYS[0]?.iso ?? "");
  const [appointmentAt, setAppointmentAt] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", phone: "", notes: "", consent: false });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // keep only ids that still exist in the live price list (e.g. a stale ?service= link)
  const chosen = useMemo(
    () => (services.data ?? []).filter((s) => selected.includes(s.id)),
    [services.data, selected],
  );
  const total = chosen.reduce((sum, s) => sum + s.priceKes, 0);
  const duration = chosen.reduce((sum, s) => sum + s.durationMinutes, 0);

  const valid = [
    chosen.length > 0,
    appointmentAt !== null,
    details.name.trim().length >= 2 && details.phone.length === 9 && details.consent,
    true,
  ][step - 1];
  const hints = [
    "Pick at least one service",
    "Choose a day and start time",
    "Name, phone and WhatsApp consent needed",
    "Nothing is charged yet",
  ];

  const toggleService = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    setAppointmentAt(null); // the time must fit the new total duration
  };

  const submit = () => {
    if (!appointmentAt) return;
    setSubmitError(null);
    create.mutate(
      {
        name: details.name.trim(),
        phone: `254${details.phone}`,
        serviceIds: chosen.map((s) => s.id),
        appointmentAt,
        notes: details.notes.trim() || undefined,
        consent: true,
      },
      {
        onError: (error) => {
          const code = (error as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error?.code;
          if (code === "BOOKING_SLOT_UNAVAILABLE") {
            // someone took the slot while this customer was filling in details
            setAppointmentAt(null);
            setStep(2);
            setSubmitError("Sorry — that time was just booked. Please pick another.");
            return;
          }
          setSubmitError(apiErrorMessage(error, "We couldn't send your booking. Please try again."));
        },
      },
    );
  };

  const next = () => {
    if (!valid) return;
    if (step === 4) submit();
    else {
      setSubmitError(null);
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    }
  };

  if (create.data) {
    return (
      <SiteContainer className="pt-10 pb-24">
        <DoneView booking={create.data} />
      </SiteContainer>
    );
  }

  return (
    <SiteContainer className="flex flex-col gap-8 pt-10 pb-24">
      <div className="max-w-160">
        <StepIndicator step={step} labels={STEP_LABELS} />
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
          {services.isLoading && <Skeleton shape="card" height={420} />}
          {services.isError && (
            <ErrorState
              heading="We couldn't load our services"
              message="Check your connection and try again."
              onRetry={() => void services.refetch()}
            />
          )}

          {services.data && step === 1 && (
            <ServiceStep services={services.data} selected={selected} onToggle={toggleService} />
          )}
          {step === 2 && submitError && (
            <p role="alert" className="rounded-2xl bg-error-bg px-5 py-4 font-semibold text-error">
              {submitError}
            </p>
          )}
          {step === 2 && (
            <TimeStep
              serviceIds={chosen.map((s) => s.id)}
              date={date}
              onDate={(iso) => {
                setDate(iso);
                setAppointmentAt(null);
              }}
              appointmentAt={appointmentAt}
              onTime={setAppointmentAt}
              duration={duration}
            />
          )}
          {step === 3 && (
            <DetailsStep {...details} onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))} />
          )}
          {step === 4 && appointmentAt && (
            <ReviewStep
              services={chosen}
              appointmentAt={appointmentAt}
              name={details.name.trim()}
              phone={details.phone}
              notes={details.notes.trim()}
              error={submitError}
              onEditDetails={() => setStep(3)}
            />
          )}

          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-line bg-surface py-2.5 pr-4.5 pl-3 font-semibold"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              Back
            </button>
          )}
        </div>

        {/* Summary */}
        <aside
          aria-label="Booking summary"
          className="sticky top-24 flex min-w-0 flex-[1_1_320px] flex-col gap-4.5 rounded-3xl border border-line bg-surface p-6 shadow-[0_10px_30px_rgba(43,29,39,0.06)]"
        >
          <h2 className="font-display text-[1.375rem] font-bold tracking-[-0.02em]">Your booking</h2>
          {chosen.length === 0 ? (
            <p className="rounded-[14px] bg-surface-raised p-4 text-[0.9375rem] text-ink-2">
              No services yet — pick at least one to continue.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {chosen.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 text-[0.9375rem]">
                  <span className="flex min-w-0 items-center gap-2">
                    <NailSwatch color={categoryContent(s.category).color} width={8} height={13} />
                    {s.name}
                  </span>
                  <span className="font-semibold whitespace-nowrap">{formatKes(s.priceKes)}</span>
                </li>
              ))}
            </ul>
          )}
          <dl className="flex flex-col gap-2.5 border-t border-divider pt-4 text-[0.9375rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">When</dt>
              <dd className="text-right font-semibold">
                {appointmentAt ? `${formatDate(appointmentAt)} · ${formatTime(appointmentAt)}` : "Not chosen yet"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">Duration</dt>
              <dd className="font-semibold">{formatMinutes(duration)}</dd>
            </div>
          </dl>
          <div className="flex justify-between gap-3 border-t border-divider pt-4 text-[1.0625rem] font-bold">
            <span>Total</span>
            <span>{formatKes(total)}</span>
          </div>
          <Button size="lg" onClick={next} disabled={!valid} loading={create.isPending} className="rounded-full">
            {step === 4 ? "Send booking request" : step === 3 ? "Review booking" : "Continue"}
          </Button>
          <p className="text-center text-[0.8125rem] text-ink-2">{hints[step - 1]}</p>
          <p className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-ink-2">
            <CircleCheck size={14} aria-hidden="true" />
            Questions? <a href={SALON.whatsappUrl} className="font-semibold text-plum-deep underline">WhatsApp us</a>
          </p>
        </aside>
      </div>

      <p className="text-sm text-ink-2">
        Already booked? <Link to="/my-booking" className="font-semibold text-plum-deep underline">Check your booking</Link>
      </p>
    </SiteContainer>
  );
}
