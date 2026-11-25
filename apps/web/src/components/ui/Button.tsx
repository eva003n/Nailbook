/**
 * Button — Nailbook "Lacquer" design
 *
 * Variants: primary (plum), secondary (white + line border), destructive
 * (outlined red; always behind a confirmation dialog), ghost, whatsapp.
 * Sizes: md 44px / radius 12, lg 52px / radius 16 (mobile primary actions).
 * Width: primary, destructive and ghost fill their container unless
 * `fullWidth={false}` (legacy behaviour kept for existing forms).
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "whatsapp";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-plum text-white hover:bg-plum-strong",
  secondary: "border border-line bg-surface text-plum-deep hover:bg-petal",
  destructive: "border border-error-line bg-surface text-error hover:bg-error-bg",
  ghost: "bg-transparent text-plum-deep hover:bg-petal",
  whatsapp: "bg-whatsapp-bg text-whatsapp hover:brightness-95",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...props },
    ref,
  ) => {
    const fills = fullWidth ?? (variant === "primary" || variant === "destructive" || variant === "ghost");
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold",
          "transition-colors duration-150 active:scale-[0.98]",
          size === "lg" ? "min-h-13 rounded-(--radius-lg) px-6 text-md" : "min-h-11 rounded-(--radius-md) px-4.5 text-[0.9375rem]",
          fills && "w-full",
          variantClasses[variant],
          (disabled || loading) && "cursor-not-allowed opacity-50 active:scale-100",
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
