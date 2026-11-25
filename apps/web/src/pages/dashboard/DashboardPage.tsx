/**
 * Dashboard — the morning at-a-glance view.
 * Greeting, key numbers, "Today's chair" timeline, up next, and bookings
 * waiting for approval with inline Approve (two taps from app open).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarX, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import BookingCard from "@/components/ui/BookingCard";
import StatStrip from "@/components/ui/StatStrip";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { BookingCardSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import NotificationBell from "@/components/NotificationBell";
import TodayTimeline, { TimelineLegend } from "@/pages/dashboard/components/TodayTimeline";
import ApprovalCard from "@/pages/dashboard/components/ApprovalCard";
import { useDashboardStats } from "@/pages/dashboard/hooks/useDashboard";
import { useBookings, useApproveBooking } from "@/pages/bookings/hooks/useBookings";
import { useBusinessHours } from "@/pages/settings/hooks/useBusinessHours";
import { useServices } from "@/hooks/useServices";
import { useOnline } from "@/hooks/useOnline";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, formatTime } from "@/lib/format";
import { categoryLookup, categoryMetaFor } from "@/lib/serviceCategory";
import type { Booking } from "@/lib/schemas";

function toHour(hhmm: string | undefined, fallback: number, round: "floor" | "ceil") {
  if (!hhmm) return fallback;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return fallback;
  return round === "floor" ? h : m > 0 ? h + 1 : h;
}

function Panel({ title, action, children, className = "" }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-(--radius-panel) border-line md:border md:bg-surface md:p-6 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 md:mb-4">
        <h2 className="font-display text-lg leading-6.5 font-semibold tracking-[-0.01em] text-ink md:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);
  const { isOnline } = useOnline();

  const stats = useDashboardStats();
  const today = useBookings({ tab: "today" });
  const pendingQuery = useBookings({ status: "PENDING", limit: 20 });
  const { data: services } = useServices();
  const { data: hours } = useBusinessHours();
  const approve = useApproveBooking();
  const [confirming, setConfirming] = useState<Booking | null>(null);

  const categories = useMemo(() => categoryLookup(services), [services]);
  const todays = useMemo(
    () => [...(today.data?.data ?? [])].sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt)),
    [today.data],
  );
  const pending = pendingQuery.data?.data ?? [];

  const now = new Date();
  const upNext = todays
    .filter((b) => new Date(b.appointmentAt).getTime() + b.durationMinutes * 60_000 > now.getTime())
    .filter((b) => b.status === "APPROVED" || b.status === "RESCHEDULED" || b.status === "PENDING")
    .slice(0, 4);

  const todayHours = hours?.find((h) => h.dayOfWeek === now.getDay() && h.isActive);
  const startHour = Math.min(toHour(todayHours?.openTime, 9, "floor"), ...todays.map((b) => new Date(b.appointmentAt).getHours()));
  const endHour = Math.max(
    toHour(todayHours?.closeTime, 19, "ceil"),
    ...todays.map((b) => Math.ceil(new Date(b.appointmentAt).getHours() + b.durationMinutes / 60)),
  );

  const handleApprove = () => {
    if (!confirming) return;
    const b = confirming;
    approve.mutate(b.id, {
      onSuccess: (booking) => {
        setConfirming(null);
        showToast({ type: "success", message: `Booking approved. ${booking.customer.name} has been notified.` });
      },
      onError: () => {
        setConfirming(null);
        showToast({ type: "error", message: "Action failed — check your connection and try again" });
      },
    });
  };

  if (stats.error || today.error) {
    return (
      <ErrorState
        heading="Couldn't load data"
        message={(stats.error?.message ?? today.error?.message) || "Check your connection and try again."}
        onRetry={() => {
          void stats.refetch();
          void today.refetch();
        }}
      />
    );
  }

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const activeToday = todays.filter((b) => b.status !== "CANCELLED").length;
  const s = stats.data;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 md:gap-7 md:px-8 md:pt-8 lg:px-12 lg:pt-9">
      <header className="flex items-start justify-between gap-4 md:items-end">
        <div className="min-w-0">
          <h1 className="font-display text-[1.875rem] leading-9 font-bold tracking-[-0.02em] md:text-[2.5rem] md:leading-11">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-2 md:text-base">
            {formatDate(now.toISOString())}.{" "}
            <span className="hidden md:inline">
              {activeToday === 0 ? "No clients booked yet." : `${activeToday} ${activeToday === 1 ? "client" : "clients"} in the chair today.`}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <span className="hidden items-center gap-2 text-sm text-ink-2 md:inline-flex">
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-live" : "bg-ink-3"}`} aria-hidden="true" />
            {isOnline ? "Live" : "Offline"}
          </span>
          <NotificationBell />
          <Button fullWidth={false} onClick={() => navigate("/admin/bookings/new")} className="hidden md:inline-flex">
            <Plus size={18} aria-hidden="true" />
            New booking
          </Button>
        </div>
      </header>

      {stats.isLoading || !s ? (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <StatStrip
          items={[
            { label: "Appointments today", value: String(s.todayBookingsCount), onClick: () => navigate("/admin/bookings") },
            {
              label: "Waiting for approval",
              value: String(s.pendingCount),
              flag: s.pendingCount > 0 ? "Needs you" : undefined,
              highlight: s.pendingCount > 0,
              onClick: () => navigate("/admin/bookings?status=PENDING"),
            },
            { label: "Collected today", unit: "KES", value: s.todayRevenueKes.toLocaleString("en-KE"), onClick: () => navigate("/admin/payments") },
            { label: "Still unpaid", unit: "KES", value: s.unpaidKes.toLocaleString("en-KE"), onClick: () => navigate("/admin/payments") },
          ]}
        />
      )}

      <Panel title="Today's chair" action={<TimelineLegend />} className="hidden md:block">
        {today.isLoading ? (
          <div className="h-37.5 animate-pulse rounded-(--radius-lg) bg-petal" />
        ) : activeToday === 0 ? (
          <EmptyState icon={CalendarX} heading="No appointments today" />
        ) : (
          <TodayTimeline bookings={todays} categories={categories} startHour={startHour} endHour={endHour} />
        )}
      </Panel>

      <div className="flex flex-col-reverse gap-5 md:grid md:grid-cols-2 md:gap-6">
        <Panel
          title="Up next"
          action={
            <button onClick={() => navigate("/admin/bookings")} className="text-sm font-semibold text-plum-deep hover:underline md:text-[0.9375rem]">
              See all bookings
            </button>
          }
        >
          {today.isLoading ? (
            <div className="flex flex-col gap-2">
              <BookingCardSkeleton />
              <BookingCardSkeleton />
            </div>
          ) : upNext.length === 0 ? (
            <p className="py-6 text-[0.9375rem] text-ink-2">Nothing else on the books for today.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line md:divide-y-0">
              {upNext.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  swatchColor={categoryMetaFor(b, categories).color}
                  showPayment={b.status === "APPROVED" && b.paymentStatus !== "SUCCESS"}
                />
              ))}
            </div>
          )}
        </Panel>

        {pending.length > 0 && (
          <Panel
            title={
              <>
                Waiting for approval
                <span className="ml-2 inline-flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-plum px-1.5 align-middle font-sans text-[0.8125rem] font-bold text-white">
                  {pending.length}
                </span>
              </>
            }
          >
            <div className="flex flex-col gap-3">
              {pending.slice(0, 3).map((b) => (
                <ApprovalCard
                  key={b.id}
                  booking={b}
                  onApprove={setConfirming}
                  approving={approve.isPending && approve.variables === b.id}
                  disabled={!isOnline}
                />
              ))}
              {pending.length > 3 && (
                <button onClick={() => navigate("/admin/bookings?status=PENDING")} className="self-start text-sm font-semibold text-plum-deep hover:underline">
                  See all {pending.length} waiting
                </button>
              )}
            </div>
          </Panel>
        )}
      </div>

      <Dialog
        open={confirming !== null}
        title="Approve booking?"
        description={
          confirming
            ? `${confirming.customer.name.split(" ")[0]} gets a WhatsApp confirmation for ${formatDate(confirming.appointmentAt)} at ${formatTime(confirming.appointmentAt)}.`
            : undefined
        }
        confirmLabel="Approve"
        cancelLabel="Not now"
        isConfirming={approve.isPending}
        onConfirm={handleApprove}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
