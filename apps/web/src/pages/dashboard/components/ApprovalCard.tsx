import { useNavigate } from "react-router-dom";
import { Calendar, Check } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import type { Booking } from "@/lib/schemas";
import { formatDateShort, formatKes, formatTime } from "@/lib/format";
import { bookingServiceLabel } from "@/lib/serviceCategory";

interface ApprovalCardProps {
  booking: Booking;
  onApprove: (booking: Booking) => void;
  approving?: boolean;
  disabled?: boolean;
}

/** Pending booking with inline Approve — approve in two taps from the dashboard. */
export default function ApprovalCard({ booking, onApprove, approving, disabled }: ApprovalCardProps) {
  const navigate = useNavigate();
  return (
    <article className="flex flex-col gap-3.5 rounded-(--radius-lg) border border-line bg-surface p-4">
      <button className="flex items-center gap-3.5 text-left" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
        <Avatar name={booking.customer.name} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base leading-5.5 font-semibold text-ink">{booking.customer.name}</span>
          <span className="block truncate text-sm leading-5 text-ink-2">
            {bookingServiceLabel(booking)}, {formatKes(booking.priceKes)}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-2">
            <Calendar size={15} aria-hidden="true" />
            {formatDateShort(booking.appointmentAt)}, {formatTime(booking.appointmentAt)}
          </span>
        </span>
      </button>
      <div className="flex gap-2.5">
        <Button
          className="flex-1"
          onClick={() => onApprove(booking)}
          loading={approving}
          disabled={disabled}
          title={disabled ? "No connection — action unavailable offline" : undefined}
          aria-label={`Approve booking for ${booking.customer.name}`}
        >
          {!approving && <Check size={18} aria-hidden="true" />}
          Approve
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => navigate(`/admin/bookings/${booking.id}/reschedule`)}>
          Reschedule
        </Button>
      </div>
    </article>
  );
}
