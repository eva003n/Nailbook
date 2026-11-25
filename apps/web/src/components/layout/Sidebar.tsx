import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/components/layout/navConfig";
import Logo from "@/components/layout/Logo";
import Avatar from "@/components/ui/Avatar";
import { usePendingCount } from "@/pages/bookings/hooks/useBookings";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { THEME_OPTIONS } from "@/lib/themeOptions";

/** Desktop/tablet navigation: icon-only at md, icon + label at lg. */
export default function Sidebar() {
  const pendingCount = usePendingCount();
  const user = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const themeIndex = Math.max(THEME_OPTIONS.findIndex((o) => o.value === theme), 0);
  const current = THEME_OPTIONS[themeIndex];
  const next = THEME_OPTIONS[(themeIndex + 1) % THEME_OPTIONS.length];
  const ThemeIcon = current.icon;

  return (
    <aside
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-paper px-3 pt-7 pb-5 md:flex md:w-20 lg:w-60 lg:px-4"
      aria-label="Primary"
    >
      <div className="flex justify-center px-0 lg:justify-start lg:px-2.5">
        <span className="lg:hidden">
          <Logo showWord={false} />
        </span>
        <span className="hidden lg:inline">
          <Logo />
        </span>
      </div>

      <nav className="mt-10 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const showBadge = item.to === "/bookings" && pendingCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                clsx(
                  "relative flex min-h-11 items-center justify-center gap-3 rounded-(--radius-md) px-3 text-[0.9375rem] transition-colors lg:justify-start",
                  isActive ? "bg-petal font-semibold text-plum-deep" : "font-medium text-ink-2 hover:bg-petal/60 hover:text-ink",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">{item.label}</span>
              {showBadge && (
                <span
                  className="absolute top-1.5 right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-plum px-1.5 text-xs font-bold text-white lg:static lg:ml-auto lg:h-5.5 lg:min-w-5.5"
                  aria-label={`${pendingCount} waiting for approval`}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setTheme(next.value)}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        title={`Theme: ${current.label}`}
        className="mt-auto mb-2 flex min-h-11 items-center justify-center gap-3 rounded-(--radius-md) px-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-petal hover:text-ink lg:justify-start"
      >
        <ThemeIcon size={20} aria-hidden="true" />
        <span className="hidden lg:inline">{current.label} theme</span>
      </button>

      {user && (
        <div className="flex items-center justify-center gap-3 rounded-(--radius-lg) border-line p-0 lg:justify-start lg:border lg:bg-surface lg:p-3">
          <Avatar name={user.name} size="sm" />
          <div className="hidden min-w-0 lg:block">
            <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
            <div className="truncate text-[0.8125rem] text-ink-2">{user.role === "OWNER" ? "Owner" : "Staff"}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
