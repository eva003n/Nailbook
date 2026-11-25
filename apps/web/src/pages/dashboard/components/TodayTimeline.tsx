/**
 * "Today's chair" — the day as a horizontal timeline. Each appointment is a
 * nail-shaped block sized by duration and coloured by service category.
 * Past appointments fade; a "Now" line marks the current time.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import type { Booking, ServiceCategory } from "@/lib/schemas";
import { formatTime } from "@/lib/format";
import { bookingServiceLabel, categoryMetaFor, SERVICE_CATEGORY_META } from "@/lib/serviceCategory";
import NailSwatch from "@/components/ui/NailSwatch";

interface TodayTimelineProps {
  bookings: Booking[];
  categories: Map<string, ServiceCategory>;
  /** Hours shown, e.g. 9 and 19 */
  startHour: number;
  endHour: number;
}

function hourLabel(h: number) {
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function hoursOf(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function shortName(name: string) {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap gap-x-4.5 gap-y-1 text-[0.8125rem] text-ink-2">
      {Object.values(SERVICE_CATEGORY_META).map((m) => (
        <span key={m.label} className="inline-flex items-center gap-1.5">
          <NailSwatch color={m.color} width={10} height={14} />
          {m.label}
        </span>
      ))}
    </div>
  );
}

export default function TodayTimeline({ bookings, categories, startHour, endHour }: TodayTimelineProps) {
  const navigate = useNavigate();
  const now = useNow();
  const span = Math.max(endHour - startHour, 1);
  const pct = (h: number) => `${((h - startHour) / span) * 100}%`;
  const nowH = hoursOf(now);
  const showNow = nowH >= startHour && nowH <= endHour;
  const hours = Array.from({ length: span + 1 }, (_, i) => startHour + i);

  const visible = bookings.filter((b) => b.status !== "CANCELLED");

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="relative h-37.5 min-w-[720px]" role="list" aria-label="Today's appointments by time">
        {hours.map((h, i) => (
          <div key={h} aria-hidden="true">
            <span
              className={clsx(
                "absolute top-0 text-xs whitespace-nowrap text-ink-3",
                i === 0 ? "translate-x-0" : i === hours.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
              )}
              style={{ left: pct(h) }}
            >
              {hourLabel(h)}
            </span>
            <span className="absolute top-6.5 bottom-0 w-px bg-line" style={{ left: pct(h) }} />
          </div>
        ))}

        {visible.map((b) => {
          const start = hoursOf(new Date(b.appointmentAt));
          const end = start + b.durationMinutes / 60;
          const meta = categoryMetaFor(b, categories);
          const past = end <= nowH;
          const short = b.durationMinutes < 45;
          const left = Math.max(start, startHour);
          const right = Math.min(end, endHour);
          if (right <= startHour || left >= endHour) return null;
          return (
            <button
              key={b.id}
              role="listitem"
              onClick={() => navigate(`/admin/bookings/${b.id}`)}
              aria-label={`${b.customer.name}, ${bookingServiceLabel(b)}, ${formatTime(b.appointmentAt)}`}
              className={clsx(
                "absolute top-10 flex h-26 flex-col justify-between overflow-hidden rounded-t-[22px] rounded-b-lg pt-3.5 pb-3 text-left transition-[opacity,transform] hover:-translate-y-0.5",
                short ? "items-center px-1" : "px-3.5",
                past && "opacity-45 hover:opacity-80",
              )}
              style={{
                left: `calc(${pct(left)} + 2px)`,
                width: `calc(${((right - left) / span) * 100}% - 4px)`,
                background: meta.color,
                color: meta.onColor,
              }}
            >
              {short ? (
                <span className="text-sm leading-4.5 font-bold">{b.customer.name.trim()[0]}</span>
              ) : (
                <>
                  <span className="min-w-0">
                    <span className="block truncate text-sm leading-4.5 font-bold">{shortName(b.customer.name)}</span>
                    <span className="block truncate text-xs leading-4 opacity-85">{bookingServiceLabel(b)}</span>
                  </span>
                  <span className="truncate text-xs font-semibold">{formatTime(b.appointmentAt)}</span>
                </>
              )}
            </button>
          );
        })}

        {showNow && (
          <div className="pointer-events-none absolute top-10 -bottom-1.5 w-0.5 bg-plum-strong" style={{ left: pct(nowH) }} aria-hidden="true">
            <span className="absolute -top-6 left-1/2 flex h-5.5 -translate-x-1/2 items-center rounded-full bg-plum-strong px-2 text-xs font-bold whitespace-nowrap text-white">
              Now {formatTime(now.toISOString())}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
