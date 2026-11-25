import { useEffect, useRef, type ReactNode } from "react";
import Button from "@/components/ui/Button";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function Dialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus moves to the destructive/confirm action on open
      confirmRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "Enter" && !isConfirming) {
      onConfirm();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      className="m-auto w-[calc(100vw-40px)] max-w-sm rounded-(--radius-xl) border-none bg-surface p-0 text-ink shadow-(--shadow-modal) backdrop:bg-ink/50 backdrop:backdrop-blur-[2px]"
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div className="p-6">
        <h2 id="dialog-title" className="font-display text-[1.375rem] leading-7 font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {description && (
          <p id="dialog-description" className="mt-2.5 text-[0.9375rem] leading-5.5 text-ink-2">
            {description}
          </p>
        )}
        {children}
        <div className="mt-6 flex gap-2.5">
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? "destructive" : "primary"}
            fullWidth
            onClick={onConfirm}
            loading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
