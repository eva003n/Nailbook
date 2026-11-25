/** Shared date strip + time-slot grid used by Create booking and Reschedule. */
import { clsx } from "clsx";
import { formatTime } from "@/lib/format";
import type { DateOption } from "./dateOptions";

export function DateStrip({ days, value, onChange }: { days: DateOption[]; value: string; onChange: (iso: string) => void }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Date">
      {days.map((d) => {
        const on = d.iso === value;
        return (
          <button
            key={d.iso}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(d.iso)}
            className={clsx(
              "flex h-17 min-w-14 flex-1 shrink-0 flex-col items-center justify-center gap-0.5 rounded-(--radius-lg) border transition-colors",
              on ? "border-plum bg-plum text-white" : "border-line bg-surface text-ink hover:border-mauve",
            )}
          >
            <span className={clsx("text-xs font-semibold", on ? "text-white/85" : "text-ink-2")}>{d.weekday}</span>
            <span className="text-lg font-bold">{d.day}</span>
          </button>
        );
      })}
    </div>
  );
}

interface Slot {
  time: string;
  available: boolean;
  appointmentAt: string;
}

export function SlotGrid({
  slots,
  value,
  onChange,
  loading,
}: {
  slots: Slot[];
  value: string | null;
  onChange: (appointmentAt: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="h-11 animate-pulse rounded-(--radius-md) bg-petal" />
        ))}
      </div>
    );
  }
  if (slots.length === 0) {
    return <p className="rounded-(--radius-md) bg-paper px-4 py-3 text-sm text-ink-2">No open times this day. Try another date.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Time">
      {slots.map((slot) => {
        const on = value === slot.appointmentAt;
        return (
          <button
            key={slot.appointmentAt}
            role="radio"
            aria-checked={on}
            disabled={!slot.available}
            onClick={() => onChange(slot.appointmentAt)}
            aria-label={`${formatTime(slot.appointmentAt)}${slot.available ? "" : ", taken"}`}
            className={clsx(
              "h-11 rounded-(--radius-md) border text-[0.9375rem] font-semibold transition-colors",
              on && "border-plum bg-plum text-white",
              !on && slot.available && "border-line bg-surface text-ink hover:border-mauve",
              !slot.available && "cursor-not-allowed border-transparent bg-paper font-medium text-ink-3 line-through",
            )}
          >
            {formatTime(slot.appointmentAt)}
          </button>
        );
      })}
    </div>
  );
}

export function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex gap-2" aria-label={`Step ${step} of ${labels.length}`}>
      {labels.map((l, i) => {
        const n = i + 1;
        return (
          <li
            key={l}
            aria-current={n === step ? "step" : undefined}
            className={clsx(
              "flex flex-1 flex-col gap-2 text-[0.8125rem] font-semibold",
              n < step ? "text-ink-2" : n === step ? "text-plum-deep" : "text-ink-3",
            )}
          >
            <span className={clsx("h-1 rounded-full", n < step ? "bg-mauve" : n === step ? "bg-plum" : "bg-line")} />
            <span className="truncate">
              {n}. {l}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
