/**
 * Booking detail — customer header, appointment details, payment, and the
 * actions allowed for the current status. Renders in the right-hand pane on
 * desktop (inside BookingsPage) and full-screen on mobile.
 */
import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { CalendarClock, MessageCircle, Phone, RefreshCw, Send, Trash2, XCircle, Check, Banknote, UserX } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import NailSwatch from "@/components/ui/NailSwatch";
import {
  useBookingDetail,
  useApproveBooking,
  useCancelBooking,
  useMarkBookingAsMissed,
  useMarkPaymentManually,
  useSendPaymentRequest,
  useMarkBookingComplete,
  useDeleteBooking,
} from "@/pages/bookings/hooks/useBookings";
import { useServices } from "@/hooks/useServices";
import { useOnline } from "@/hooks/useOnline";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, formatDateShort, formatKes, formatPhone, formatPhoneForWhatsApp, formatTime } from "@/lib/format";
import { categoryLookup, categoryMetaFor } from "@/lib/serviceCategory";

type DialogKind = "approve" | "cancel" | "complete" | "mark-paid" | "no_show" | "delete" | null;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4.5 py-3.5 first:border-t-0">
      <dt className="text-[0.9375rem] text-ink-2">{label}</dt>
      <dd className="text-right text-[0.9375rem] font-semibold text-ink">{children}</dd>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("Missing booking ID");

  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const isOwner = useAuthStore((s) => s.user?.role === "OWNER");
  const { isOnline } = useOnline();
  const [activeDialog, setActiveDialog] = useState<DialogKind>(null);

  const { data: booking, isLoading, error, refetch } = useBookingDetail(id);
  const { data: services } = useServices();
  const approveMutation = useApproveBooking();
  const cancelMutation = useCancelBooking();
  const missedMutation = useMarkBookingAsMissed();
  const markPaidMutation = useMarkPaymentManually();
  const completedMutation = useMarkBookingComplete();
  const paymentRequestMutation = useSendPaymentRequest();
  const deleteMutation = useDeleteBooking();

  const header = (action?: React.ReactNode) => (
    <PageHeader
      title={booking ? `Booking ${booking.reference}` : "Booking"}
      showBack
      backTo="/bookings"
      hideBackOnDesktop
      action={action}
      bell={false}
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {header()}
        <div className="space-y-4 px-5 py-4 md:px-8 lg:px-12">
          <Skeleton shape="heading" width="100%" height="72px" />
          <Skeleton shape="text" width="100%" height="280px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        {header()}
        <ErrorState heading="Couldn't load booking details" message="Check your connection and try again." onRetry={refetch} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col">
        {header()}
        <ErrorState heading="Booking not found" message="This booking may have been removed." />
      </div>
    );
  }

  const closeDialog = () => setActiveDialog(null);
  const fail = () => {
    showToast({ type: "error", message: "Action failed — check your connection and try again" });
    closeDialog();
  };
  const firstName = booking.customer.name.split(" ")[0];

  const handleApprove = () =>
    approveMutation.mutate(booking.id, {
      onSuccess: () => {
        showToast({ type: "success", message: `Booking approved. ${firstName} has been notified.` });
        closeDialog();
      },
      onError: fail,
    });

  const handleCancel = () =>
    cancelMutation.mutate(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          showToast({ type: "success", message: `Booking cancelled. ${firstName} has been notified.` });
          closeDialog();
        },
        onError: fail,
      },
    );

  const handleBookingMissed = () =>
    missedMutation.mutate(booking.id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Marked as a no-show." });
        closeDialog();
      },
      onError: fail,
    });

  const handleComplete = () =>
    completedMutation.mutate(booking.id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Booking marked complete." });
        closeDialog();
      },
      onError: fail,
    });

  const handleMarkPaid = () =>
    markPaidMutation.mutate(booking.id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Payment recorded as paid in cash." });
        closeDialog();
      },
      onError: fail,
    });

  const handleSendPaymentRequest = () =>
    paymentRequestMutation.mutate(
      { bookingId: booking.id, phoneNumber: booking.customer.phone },
      {
        onSuccess: () => showToast({ type: "success", message: `M-Pesa request sent to ${firstName}.` }),
        onError: () => showToast({ type: "error", message: "Payment request failed. Retry from the booking detail." }),
      },
    );

  const handleDelete = () =>
    deleteMutation.mutate(booking.id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Booking deleted." });
        closeDialog();
        navigate("/admin/bookings");
      },
      onError: () => {
        showToast({ type: "error", message: "Couldn't delete this booking. It may have a paid or refunded payment." });
        closeDialog();
      },
    });

  const isPaid = booking.paymentStatus === "SUCCESS";
  const isReadOnly = booking.status === "COMPLETED" || booking.status === "CANCELLED";
  const canTakePayment = booking.status !== "PENDING" && !isPaid && booking.status !== "NO_SHOW";
  const offlineTitle = !isOnline ? "No connection — action unavailable offline" : undefined;
  const categories = categoryLookup(services);
  const meta = categoryMetaFor(booking, categories);
  const serviceNames =
    booking.services && booking.services.length > 0
      ? booking.services.map((bs) => bs.service.name)
      : [booking.service?.name ?? "Nail service"];
  const end = new Date(new Date(booking.appointmentAt).getTime() + booking.durationMinutes * 60_000).toISOString();

  return (
    <div className="flex min-h-full flex-col">
      {header(
        isOwner ? (
          <Button
            variant="ghost"
            fullWidth={false}
            className="w-11 px-0 text-ink-2 hover:text-error"
            onClick={() => setActiveDialog("delete")}
            aria-label={`Delete booking for ${booking.customer.name}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </Button>
        ) : undefined,
      )}

      <div className="flex flex-1 flex-col gap-5 px-5 pb-6 md:px-8 lg:gap-6 lg:px-12 lg:pb-9">
        {booking.status === "CANCELLED" && (
          <div role="status" className="flex items-center gap-2 rounded-(--radius-md) bg-error-bg px-4 py-3 text-sm font-semibold text-error">
            <XCircle size={16} aria-hidden="true" />
            This booking was cancelled.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 lg:gap-4.5">
          <span className="lg:hidden">
            <Avatar name={booking.customer.name} size="lg" />
          </span>
          <span className="hidden lg:block">
            <Avatar name={booking.customer.name} size="xl" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl leading-7 font-bold tracking-[-0.02em] lg:text-[1.75rem] lg:leading-8.5">
              {booking.customer.name}
            </p>
            <p className="mt-0.5 text-sm text-ink-2 lg:text-[0.9375rem]">{formatPhone(booking.customer.phone)}</p>
          </div>
          <div className="flex w-full gap-2.5 sm:w-auto">
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(booking.customer.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-(--radius-md) bg-whatsapp-bg px-4.5 text-[0.9375rem] font-semibold text-whatsapp sm:flex-none"
              aria-label={`Open WhatsApp chat with ${booking.customer.name}`}
            >
              <MessageCircle size={18} aria-hidden="true" />
              <span className="sm:hidden lg:inline">Message on WhatsApp</span>
              <span className="hidden sm:inline lg:hidden">WhatsApp</span>
            </a>
            <a
              href={`tel:${booking.customer.phone}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-md) border border-line bg-surface px-4.5 text-[0.9375rem] font-semibold text-plum-deep"
              aria-label={`Call ${booking.customer.name}`}
            >
              <Phone size={18} aria-hidden="true" />
              Call
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:gap-6">
          <dl className="rounded-(--radius-lg) border border-line bg-surface xl:flex-[1.2]">
            <Row label={serviceNames.length > 1 ? "Services" : "Service"}>
              <span className="inline-flex flex-col items-end gap-0.5">
                {serviceNames.map((n, i) => (
                  <span key={i} className="inline-flex items-center gap-2">
                    {i === 0 && <NailSwatch color={meta.color} />}
                    {n}
                  </span>
                ))}
              </span>
            </Row>
            <Row label="Date">
              <span className="lg:hidden">{formatDateShort(booking.appointmentAt)}</span>
              <span className="hidden lg:inline">{formatDate(booking.appointmentAt)}</span>
            </Row>
            <Row label="Time">
              {formatTime(booking.appointmentAt)} to {formatTime(end)}
            </Row>
            <Row label="Duration">{booking.durationMinutes} min</Row>
            <Row label="Price">
              <span className="tabular-nums">{formatKes(booking.priceKes)}</span>
            </Row>
            <Row label="Booking">
              <Badge kind="booking" status={booking.status} />
            </Row>
            <Row label="Payment">
              <Badge kind="payment" status={booking.paymentStatus} />
            </Row>
          </dl>

          <section className="flex flex-col gap-4 rounded-(--radius-lg) border border-line bg-surface p-5 xl:flex-1">
            <h2 className="font-display text-[1.0625rem] font-semibold">Details</h2>
            <div className="flex items-start gap-3 text-[0.9375rem]">
              <CalendarClock size={18} className="mt-0.5 shrink-0 text-plum" aria-hidden="true" />
              <div>
                <div className="font-semibold">Booked {formatDateShort(booking.createdAt)}</div>
                <div className="text-[0.8125rem] text-ink-2">at {formatTime(booking.createdAt)}</div>
              </div>
            </div>
            {booking.payment?.mpesaReceiptNumber && (
              <div className="flex items-start gap-3 text-[0.9375rem]">
                <Banknote size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                <div>
                  <div className="font-semibold">M-Pesa receipt {booking.payment.mpesaReceiptNumber}</div>
                  <div className="text-[0.8125rem] text-ink-2">{formatDateShort(booking.payment.createdAt)}</div>
                </div>
              </div>
            )}
            {!isPaid && canTakePayment && !isReadOnly && (
              <div className="flex items-start gap-3 text-[0.9375rem]">
                <Send size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <div className="font-semibold">Not paid yet</div>
                  <div className="text-[0.8125rem] text-ink-2">Send an M-Pesa request before the visit.</div>
                </div>
              </div>
            )}
            {booking.notes && (
              <div className="rounded-(--radius-md) bg-petal px-4 py-3 text-sm text-ink">
                <span className="font-semibold text-plum-deep">Note: </span>
                {booking.notes}
              </div>
            )}
            <p className="mt-auto text-[0.8125rem] text-ink-2 lg:hidden">
              Reference <span className="font-semibold text-ink">{booking.reference}</span>
            </p>
          </section>
        </div>

        {!isReadOnly && (
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+84px)] -mx-5 mt-auto flex flex-col gap-2.5 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur md:-mx-8 md:bottom-0 md:px-8 lg:static lg:mx-0 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3 lg:bg-transparent lg:px-0 lg:pt-5 lg:pb-0 lg:backdrop-blur-none">
            {booking.status === "PENDING" && (
              <Button size="lg" className="lg:w-auto" onClick={() => setActiveDialog("approve")} disabled={!isOnline} title={offlineTitle}>
                <Check size={18} aria-hidden="true" />
                Approve booking
              </Button>
            )}
            {canTakePayment && (
              <Button
                size="lg"
                className="lg:w-auto"
                onClick={handleSendPaymentRequest}
                loading={paymentRequestMutation.isPending}
                disabled={!isOnline}
                title={offlineTitle}
              >
                {!paymentRequestMutation.isPending && <Send size={18} aria-hidden="true" />}
                Send M-Pesa request
              </Button>
            )}
            {canTakePayment && (
              <Button variant="secondary" size="lg" onClick={() => setActiveDialog("mark-paid")}>
                <Banknote size={18} aria-hidden="true" />
                Mark paid in cash
              </Button>
            )}
            {booking.status === "APPROVED" && !isPaid && (
              <Button variant="secondary" size="lg" onClick={() => setActiveDialog("complete")}>
                <Check size={18} aria-hidden="true" />
                Mark complete
              </Button>
            )}
            {booking.status === "APPROVED" && (
              <Button variant="secondary" size="lg" onClick={() => navigate(`/admin/bookings/${booking.id}/reschedule`)}>
                <RefreshCw size={18} aria-hidden="true" />
                Reschedule
              </Button>
            )}
            <span className="hidden flex-1 lg:block" />
            {booking.status === "APPROVED" && !isPaid && (
              <Button variant="ghost" size="lg" fullWidth={false} className="text-ink-2" onClick={() => setActiveDialog("no_show")}>
                <UserX size={18} aria-hidden="true" />
                No-show
              </Button>
            )}
            {booking.status === "APPROVED" && !isPaid && (
              <Button variant="destructive" size="lg" className="lg:w-auto" onClick={() => setActiveDialog("cancel")}>
                <XCircle size={18} aria-hidden="true" />
                Cancel booking
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={activeDialog === "approve"}
        title="Approve booking?"
        description={`${firstName} gets a WhatsApp confirmation for ${formatDate(booking.appointmentAt)} at ${formatTime(booking.appointmentAt)}.`}
        confirmLabel="Approve"
        cancelLabel="Not now"
        isConfirming={approveMutation.isPending}
        onConfirm={handleApprove}
        onCancel={closeDialog}
      />
      <Dialog
        open={activeDialog === "cancel"}
        title="Cancel this appointment?"
        description={`${firstName} will be told on WhatsApp that the appointment is cancelled.`}
        confirmLabel="Cancel appointment"
        cancelLabel="Keep"
        destructive
        isConfirming={cancelMutation.isPending}
        onConfirm={handleCancel}
        onCancel={closeDialog}
      />
      <Dialog
        open={activeDialog === "no_show"}
        title="Mark as a no-show?"
        description={`Use this if ${firstName} didn't come to the appointment.`}
        confirmLabel="Mark no-show"
        cancelLabel="Back"
        isConfirming={missedMutation.isPending}
        onConfirm={handleBookingMissed}
        onCancel={closeDialog}
      />
      <Dialog
        open={activeDialog === "complete"}
        title="Mark booking complete?"
        description="This moves the booking to completed."
        confirmLabel="Mark complete"
        isConfirming={completedMutation.isPending}
        onConfirm={handleComplete}
        onCancel={closeDialog}
      />
      <Dialog
        open={activeDialog === "mark-paid"}
        title="Mark as paid in cash?"
        description="Use this only if the customer paid in person, not via M-Pesa."
        confirmLabel="Mark paid"
        isConfirming={markPaidMutation.isPending}
        onConfirm={handleMarkPaid}
        onCancel={closeDialog}
      />
      <Dialog
        open={activeDialog === "delete"}
        title="Delete this booking?"
        description={`Permanently delete the booking for ${booking.customer.name}. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={closeDialog}
      />

      {/* Reschedule renders as a sheet/modal over the detail */}
      <Outlet />
    </div>
  );
}
