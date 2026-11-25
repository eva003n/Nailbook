import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, RefreshCw, X } from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import NailSwatch from "@/components/ui/NailSwatch";
import type { Booking } from "@/lib/schemas";
import { formatTime } from "@/lib/format";
import { bookingServiceLabel } from "@/lib/serviceCategory";

interface BookingCardProps {
  booking: Booking;
  onApprove?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  /** Highlights the row (list/detail selection) */
  selected?: boolean;
  /** Category swatch colour; when set, replaces the avatar with a tall nail swatch */
  swatchColor?: string;
  /** Show payment status badge instead of booking status */
  showPayment?: boolean;
}

/**
 * Booking row: avatar (or swatch), customer, service, time + status.
 * On touch devices, swipe left reveals Approve / Move / Cancel.
 */
export default function BookingCard({
  booking,
  onApprove,
  onReschedule,
  onCancel,
  selected,
  swatchColor,
  showPayment,
}: BookingCardProps) {
  const navigate = useNavigate();
  const startX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const canApprove = booking.status === "PENDING" && onApprove;
  const canReschedule = (booking.status === "PENDING" || booking.status === "APPROVED") && onReschedule;
  const canCancel = (booking.status === "PENDING" || booking.status === "APPROVED") && onCancel;

  const hasActions = canApprove || canReschedule || canCancel;
  const actionWidth = [canApprove, canReschedule, canCancel].filter(Boolean).length * 64;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasActions) return;
    startX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || !hasActions) return;
    const delta = e.touches[0].clientX - startX.current;
    if (delta < 0) setSwipeOffset(Math.max(delta, -actionWidth));
  };
  const handleTouchEnd = () => {
    setSwipeOffset(swipeOffset < -actionWidth / 2 ? -actionWidth : 0);
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-(--radius-lg)">
      {hasActions && (
        <div className="absolute inset-y-0 right-0 flex">
          {canApprove && (
            <button
              onClick={() => {
                onApprove(booking.id);
                setSwipeOffset(0);
              }}
              className="flex w-16 flex-col items-center justify-center gap-1 bg-plum text-white"
              aria-label={`Approve booking for ${booking.customer.name}`}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              <span className="text-2xs font-semibold">Approve</span>
            </button>
          )}
          {canReschedule && (
            <button
              onClick={() => {
                onReschedule(booking.id);
                setSwipeOffset(0);
              }}
              className="flex w-16 flex-col items-center justify-center gap-1 bg-info text-white"
              aria-label={`Reschedule booking for ${booking.customer.name}`}
            >
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              <span className="text-2xs font-semibold">Move</span>
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => {
                onCancel(booking.id);
                setSwipeOffset(0);
              }}
              className="flex w-16 flex-col items-center justify-center gap-1 bg-error text-white"
              aria-label={`Cancel booking for ${booking.customer.name}`}
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="text-2xs font-semibold">Cancel</span>
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (swipeOffset !== 0) {
            setSwipeOffset(0);
            return;
          }
          navigate(`/admin/bookings/${booking.id}`);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        aria-current={selected ? "true" : undefined}
        className={clsx(
          "relative flex w-full items-center gap-3.5 p-3 text-left transition-[transform,background-color]",
          selected ? "bg-petal" : "bg-surface hover:bg-paper md:bg-transparent md:hover:bg-surface",
        )}
      >
        {swatchColor ? <NailSwatch color={swatchColor} width={12} height={40} /> : <Avatar name={booking.customer.name} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-5.5 font-semibold text-ink">{booking.customer.name}</p>
          <p className="truncate text-sm leading-5 text-ink-2">{bookingServiceLabel(booking)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[0.9375rem] font-semibold text-ink tabular-nums">{formatTime(booking.appointmentAt)}</span>
          {showPayment ? (
            <Badge kind="payment" status={booking.paymentStatus} />
          ) : (
            <Badge kind="booking" status={booking.status} />
          )}
        </div>
      </button>
    </div>
  );
}
