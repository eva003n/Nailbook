/**
 * PageHeader
 *
 * Top-level pages: large Bricolage title, optional subtitle, actions and the
 * notification bell on the right.
 * Detail pages (`showBack`): compact bar with back button, title and actions.
 */
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  showBack?: boolean;
  /** Where back goes; defaults to history back */
  backTo?: string;
  /** Hide the back button from lg up (list/detail layout shows the list instead) */
  hideBackOnDesktop?: boolean;
  action?: ReactNode;
  /** Show the notification bell (default: on for top-level pages) */
  bell?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  backTo,
  hideBackOnDesktop = false,
  action,
  bell,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const showBell = bell ?? !showBack;

  if (showBack) {
    return (
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-paper/95 px-3 backdrop-blur md:px-6 lg:static lg:bg-transparent">
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className={`flex h-11 w-11 items-center justify-center rounded-(--radius-md) text-plum-deep hover:bg-petal ${hideBackOnDesktop ? "lg:hidden" : ""}`}
          aria-label="Go back"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-ink">{title}</h1>
        <div className="flex items-center gap-2">
          {action}
          {showBell && <NotificationBell />}
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-5 pt-6 pb-2 md:px-8 md:pt-8 lg:px-12 lg:pt-9">
      <div className="min-w-0">
        <h1 className="font-display text-[1.875rem] leading-9 font-bold tracking-[-0.02em] text-ink md:text-[2.5rem] md:leading-11">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-[0.9375rem] leading-6 text-ink-2 md:text-base">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        {showBell && <NotificationBell />}
      </div>
    </header>
  );
}
