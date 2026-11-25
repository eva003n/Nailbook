import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomSheet from "@/components/ui/BottomSheet";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import { useBooking, useRescheduleBooking } from "@/pages/bookings/hooks/useBookings";
import { useAvailableSlots } from "@/hooks/useServices";
import { useUiStore } from "@/store/ui.store";
import { formatDate, formatTime } from "@/lib/format";
import { DateStrip, SlotGrid } from "@/pages/bookings/components/SlotPicker";
import { nextDays } from "@/pages/bookings/components/dateOptions";

export default function RescheduleBookingPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("Missing booking ID");

  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);

  const { data: booking } = useBooking(id);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const serviceIds = useMemo(() => {
    if (!booking) return [];
    return booking.services?.map((bs) => bs.service.id) ?? (booking.service ? [booking.service.id] : []);
  }, [booking]);

  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(serviceIds, selectedDate);
  const slotsArray: { time: string; available: boolean; appointmentAt: string }[] = slots ?? [];
  const rescheduleMutation = useRescheduleBooking();

  const dateOptions = useMemo(() => nextDays(14), []);

  const handleClose = () => navigate(`/admin/bookings/${id}`);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    rescheduleMutation.mutate(
      { bookingId: id, newStartAt: selectedSlot },
      {
        onSuccess: () => {
          showToast({type: "success", message: `Rescheduled to ${formatTime(selectedSlot)}.`});
          handleClose();
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "This slot was just taken — please choose another";
          showToast({type: "error", message});
          setConfirmOpen(false);
        },
      },
    );
  };

  return (
    <>
      <BottomSheet open title="Reschedule booking" onClose={handleClose}>
        <div className="flex flex-col gap-4">
          {booking && (
            <p className="text-[0.9375rem] text-ink-2">
              Now {new Date(booking.appointmentAt).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })} at{" "}
              {formatTime(booking.appointmentAt)}. Pick a new day and time for {booking.customer.name.split(" ")[0]}.
            </p>
          )}
          <DateStrip
            days={dateOptions}
            value={selectedDate}
            onChange={(iso) => {
              setSelectedDate(iso);
              setSelectedSlot(null);
            }}
          />
          <SlotGrid slots={slotsArray} value={selectedSlot} onChange={setSelectedSlot} loading={slotsLoading} />
          <Button size="lg" disabled={!selectedSlot} onClick={() => setConfirmOpen(true)}>
            {selectedSlot ? `Move to ${formatTime(selectedSlot)}` : "Pick a time"}
          </Button>
        </div>
      </BottomSheet>

      <Dialog
        open={confirmOpen}
        title="Reschedule booking?"
        description={selectedSlot ? `Move to ${formatDate(selectedSlot)} at ${formatTime(selectedSlot)}. The customer is told on WhatsApp.` : undefined}
        confirmLabel="Reschedule"
        cancelLabel="Back"
        isConfirming={rescheduleMutation.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}