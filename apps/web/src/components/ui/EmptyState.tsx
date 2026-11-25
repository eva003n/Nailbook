import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
}: EmptyStateProps) {
  // if (typeof icon === "function") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-petal">
          <Icon className="h-7 w-7 text-plum" aria-hidden="true" />
        </span>
        <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">{heading}</h3>
        {description && (
          <p className="max-w-xs text-[0.9375rem] leading-5.5 text-ink-2">{description}</p>
        )}
        {action}
      </div>
    );

}
