/**
 * Status badge — pill with icon + text on a light tint.
 * Colour is never the only signal: every badge has a text label and aria-label.
 */
import { clsx } from "clsx";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Star,
  XCircle,
  CalendarOff,
  type LucideIcon,
} from "lucide-react";

type BadgeVariant = "success" | "warning" | "error" | "neutral" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  icon?: boolean;
  /** Shorthand: derive variant, label and icon from a booking or payment status */
  kind?: "booking" | "payment";
  status?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  neutral: "bg-surface-raised text-ink-2",
  info: "bg-info-bg text-info",
};

const variantIcons: Record<BadgeVariant, LucideIcon> = {
  success: BadgeCheck,
  warning: Clock,
  error: XCircle,
  neutral: CalendarOff,
  info: CheckCircle2,
};

interface StatusDisplay {
  variant: BadgeVariant;
  label: string;
  icon: LucideIcon;
}

// eslint-disable-next-line react-refresh/only-export-components
export function bookingStatusToBadge(status: string): StatusDisplay {
  switch (status) {
    case "PENDING":
      return { variant: "warning", label: "Pending", icon: Clock };
    case "APPROVED":
      return { variant: "info", label: "Confirmed", icon: CheckCircle2 };
    case "RESCHEDULED":
      return { variant: "info", label: "Rescheduled", icon: RefreshCw };
    case "COMPLETED":
      return { variant: "success", label: "Completed", icon: Star };
    case "CANCELLED":
      return { variant: "error", label: "Cancelled", icon: XCircle };
    case "NO_SHOW":
      return { variant: "neutral", label: "No-show", icon: CalendarOff };
    default:
      return { variant: "neutral", label: status, icon: Clock };
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function paymentStatusToBadge(status: string): StatusDisplay {
  switch (status) {
    case "SUCCESS":
      return { variant: "success", label: "Paid", icon: BadgeCheck };
    case "PENDING":
      return { variant: "warning", label: "Awaiting payment", icon: CreditCard };
    case "RECONCILING":
      return { variant: "warning", label: "Checking payment", icon: Clock };
    case "FAILED":
      return { variant: "error", label: "Failed", icon: XCircle };
    case "CANCELLED":
      return { variant: "error", label: "Cancelled", icon: XCircle };
    case "EXPIRED":
      return { variant: "neutral", label: "Request expired", icon: Clock };
    case "REFUNDED":
      return { variant: "info", label: "Refunded", icon: RefreshCw };
    default:
      return { variant: "neutral", label: status, icon: CreditCard };
  }
}

const base =
  "inline-flex h-6.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-2 pr-2.5 text-[0.8125rem] font-semibold";

export default function Badge({
  variant = "warning",
  children,
  className,
  ariaLabel,
  icon = true,
  kind,
  status,
}: BadgeProps) {
  if (kind && status) {
    const d = kind === "booking" ? bookingStatusToBadge(status) : paymentStatusToBadge(status);
    const Icon = d.icon;
    return (
      <span className={clsx(base, variantStyles[d.variant], className)} aria-label={ariaLabel || `Status: ${d.label}`}>
        <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
        {d.label}
      </span>
    );
  }

  const Icon = variantIcons[variant];
  return (
    <span
      className={clsx(base, variantStyles[variant], className)}
      aria-label={ariaLabel || (typeof children === "string" ? `Status: ${children}` : undefined)}
    >
      {icon && <Icon size={14} strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </span>
  );
}
