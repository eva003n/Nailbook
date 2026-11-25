import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/components/layout/navConfig";
import { usePendingCount } from "@/pages/bookings/hooks/useBookings";

/** Mobile tab bar (< md). Pending approvals badge sits on Bookings. */
export default function BottomNav() {
  const pendingCount = usePendingCount();

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-30 flex border-t border-line bg-surface px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] md:hidden"
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const showBadge = item.to === "/bookings" && pendingCount > 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold",
                isActive ? "text-plum-deep" : "text-ink-2",
              )
            }
          >
            <span className="relative">
              <Icon className="h-6 w-6" aria-hidden="true" />
              {showBadge && (
                <span
                  className="absolute -top-1.5 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-surface bg-plum px-1 text-[0.6875rem] font-bold text-white"
                  aria-label={`${pendingCount} waiting for approval`}
                >
                  {pendingCount}
                </span>
              )}
            </span>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
