/**
 * §7.4 Toast Notifications
 *
 * Position: fixed, bottom: 64px (nav height) + safe-area + 8px, centered
 * Width: left-4 right-4, max-width from DESIGN.md
 * Background: semantic tinted background (--color-*-bg)
 * Border: 1px solid --color-* (status colour)
 * Border-radius: --radius-md
 * Padding: 12px 16px
 * Auto-dismiss: 3000ms (errors require manual dismiss)
 * §10 Accessibility: role="status", aria-live="polite" (errors: role="alert", assertive)
 */
import { useEffect, useState } from "react";
import { useUiStore, type ToastItem } from "@/store/ui.store";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { clsx } from "clsx";

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-[calc(84px+env(safe-area-inset-bottom)+8px)] left-4 right-4 z-50 flex flex-col items-center md:bottom-6 md:left-auto md:right-6 md:w-md"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastItem;
  onDismiss: () => void;
}

/* Ink toast; the icon carries the status colour */
const toastConfig: Record<ToastItem["type"], string> = {
  success: "[&>svg]:text-[#8FD9AB]",
  error: "[&>svg]:text-[#F5A59D]",
  info: "[&>svg]:text-[#A9C7F5]",
  warning: "[&>svg]:text-[#F5C97A]",
};

const toastIcons: Record<ToastItem["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: Info,
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const isError = toast.type === "error";
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    /* Errors require manual dismiss — no auto-dismiss */
    if (isError) return;

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 200);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isError, onDismiss]);

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={clsx(
        "flex w-full max-w-md items-center gap-3 border border-toast-line bg-toast text-white",
        "rounded-(--radius-lg)",
        "min-h-14 px-4 py-3",
        "shadow-(--shadow-raised)",
        "animate-slide-up",
        toastConfig[toast.type],
      )}
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateY(8px)" : "translateY(0)",
        transition: exiting
          ? "opacity 200ms var(--ease-in), transform 200ms var(--ease-in)"
          : "opacity var(--duration-standard) var(--ease-out), transform var(--duration-standard) var(--ease-out)",
        marginBottom: "8px",
      }}
    >
      <Icon size={18} className="shrink-0" />
      <p className="text-[0.9375rem] font-medium">{toast.message}</p>
    </div>
  );
}