/**
 * Bookings — list grouped by day, with search and filters.
 * lg+: list on the left, selected booking (nested route) on the right.
 * < lg: list OR detail, depending on the URL.
 */
import { useEffect, useMemo, useState } from "react";
import { Outlet, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, MousePointerClick, Plus, Search } from "lucide-react";
import { clsx } from "clsx";
import { useBookings } from "./hooks/useBookings";
import BookingCard from "@/components/ui/BookingCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Pagination from "@/components/ui/Pagination";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { BookingCardSkeleton } from "@/components/ui/Skeleton";
import NotificationBell from "@/components/NotificationBell";
import { formatDate, isToday } from "@/lib/format";
import { bookingServiceLabel } from "@/lib/serviceCategory";
import type { Booking } from "@/lib/schemas";

type Tab = "today" | "all";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Any status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No-show" },
];

function groupByDay(bookings: Booking[]) {
  const groups = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = new Date(b.appointmentAt).toDateString();
    const list = groups.get(key) ?? [];
    list.push(b);
    groups.set(key, list);
  }
  return [...groups.values()];
}

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [tab, setTab] = useState<Tab>(status ? "all" : "today");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim().toLowerCase());

  const detailMatch = useMatch("/admin/bookings/:id/*");
  const selectedId = detailMatch?.params.id && detailMatch.params.id !== "new" ? detailMatch.params.id : undefined;

  const { data: result, isLoading, error, refetch } = useBookings(
    tab === "today" ? { tab: "today" } : { status: status || undefined, page, limit },
  );

  const bookings = useMemo(() => {
    const list = [...(result?.data ?? [])];
    const filtered = tab === "today" && status ? list.filter((b) => b.status === status) : list;
    const searched = q
      ? filtered.filter((b) => b.customer.name.toLowerCase().includes(q) || bookingServiceLabel(b).toLowerCase().includes(q) || b.customer.phone.includes(q))
      : filtered;
    return searched.sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt));
  }, [result, tab, status, q]);
  const meta = tab === "all" ? result?.meta : undefined;

  const setStatus = (value: string) => {
    setPage(1);
    const next = new URLSearchParams(params);
    if (value) next.set("status", value);
    else next.delete("status");
    setParams(next, { replace: true });
  };

  return (
    <div className="flex min-h-full flex-1">
      {/* List column */}
      <section
        className={clsx(
          "flex w-full flex-col gap-4 px-5 pt-6 pb-6 md:px-8 md:pt-8 lg:w-110 lg:shrink-0 lg:border-r lg:border-line lg:px-6 lg:pt-9",
          selectedId && "hidden lg:flex",
        )}
        aria-label="Bookings list"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[1.875rem] leading-9 font-bold tracking-[-0.02em] md:text-[2rem] md:leading-9.5">Bookings</h1>
          <div className="flex items-center gap-2.5">
            <span className="lg:hidden">
              <NotificationBell />
            </span>
            <Button fullWidth={false} onClick={() => navigate("/admin/bookings/new")}>
              <Plus size={18} aria-hidden="true" />
              New
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SegmentedControl
            aria-label="Booking range"
            options={[
              { value: "today", label: "Today" },
              { value: "all", label: "All" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
          />
          <label className="sr-only" htmlFor="booking-status">
            Status
          </label>
          <select
            id="booking-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-(--radius-md) border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-plum focus:outline-none"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex h-11 items-center gap-2.5 rounded-(--radius-md) border border-line bg-surface px-3.5 focus-within:border-plum">
          <Search size={18} className="text-ink-3" aria-hidden="true" />
          <span className="sr-only">Search bookings</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or service"
            className="h-full flex-1 bg-transparent text-[0.9375rem] text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </label>

        {isLoading ? (
          <div className="flex flex-col gap-1">
            {[1, 2, 3, 4].map((i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState heading="Couldn't load bookings" message={error.message ?? "Check your connection and try again."} onRetry={refetch} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            heading="No bookings found"
            description={
              q || status
                ? "Try a different search or status."
                : "Share the website booking link with clients to get started."
            }
            action={
              <Button fullWidth={false} onClick={() => navigate("/admin/bookings/new")}>
                <Plus size={18} aria-hidden="true" />
                New booking
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col">
            {groupByDay(bookings).map((group) => {
              const iso = group[0].appointmentAt;
              return (
                <div key={iso} className="flex flex-col">
                  <h2 className="px-3 pt-4 pb-1.5 text-sm font-semibold text-ink-2 first:pt-1">
                    {isToday(iso) ? `Today, ${formatDate(iso)}` : formatDate(iso)}
                  </h2>
                  {group.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      selected={b.id === selectedId}
                      showPayment={b.status === "APPROVED" && b.paymentStatus !== "SUCCESS"}
                    />
                  ))}
                </div>
              );
            })}
            {meta && meta.totalPages > 1 && (
              <div className="pt-4">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                  limit={meta.limit}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Detail column (desktop) / full screen (mobile when selected) */}
      <section className={clsx("min-w-0 flex-1 bg-surface", selectedId ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
        {selectedId ? (
          <Outlet />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={MousePointerClick} heading="Pick a booking" description="Its details and actions show up here." />
          </div>
        )}
      </section>

      {/* /bookings/new renders as a sheet/modal over the list */}
      {!selectedId && <Outlet />}
    </div>
  );
}
