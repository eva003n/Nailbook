import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "@/components/ui/BottomSheet";
import Dialog from "@/components/ui/Dialog";
import CreateBookingForm from "@/pages/bookings/components/CreateBookingForm";

export default function CreateBookingPage() {
  const navigate = useNavigate();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const handleClose = () => navigate("/admin/bookings");

  return (
    <>
      <BottomSheet open title="New booking" onClose={() => setConfirmDiscard(true)}>
        <CreateBookingForm onSuccess={handleClose} onRequestClose={() => setConfirmDiscard(true)} />
      </BottomSheet>

      <Dialog
        open={confirmDiscard}
        title="Discard booking?"
        description="What you have entered so far will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={handleClose}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
