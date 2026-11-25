import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { SALON } from "@/pages/site/siteContent";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services", end: false },
  { to: "/faq", label: "FAQs", end: false },
  { to: "/my-booking", label: "My booking", end: false },
];

/** Shared max-width wrapper for every public section. */
export function SiteContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-300 px-4 sm:px-6", className)}>{children}</div>;
}

/** Pill-shaped primary/secondary links used as buttons across the site. */
export function SiteButtonLink({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  to: string;
  variant?: "primary" | "secondary" | "light";
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
        size === "lg" ? "min-h-13 px-7 text-[1.0625rem]" : "min-h-11 px-5 text-[0.9375rem]",
        variant === "primary" && "bg-plum-strong text-white hover:bg-plum",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-petal",
        variant === "light" && "bg-paper text-ink hover:bg-petal",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close the phone menu after navigating
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <SiteContainer className="flex min-h-16 items-center justify-between gap-4 py-2">
        <Link to="/" aria-label={`${SALON.name} home`} className="rounded-(--radius-sm)">
          <Logo size={24} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "rounded-(--radius-sm) px-3 py-2.5 text-[0.9375rem] transition-colors",
                  isActive ? "bg-petal font-semibold text-ink" : "font-medium text-ink-2 hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <SiteButtonLink to="/book" className="ml-2">
            Book now
          </SiteButtonLink>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <SiteButtonLink to="/book">Book now</SiteButtonLink>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </SiteContainer>

      {open && (
        <nav id="site-menu" aria-label="Main" className="border-t border-line bg-paper md:hidden">
          <SiteContainer className="flex flex-col py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx("rounded-(--radius-sm) px-3 py-3 text-base", isActive ? "bg-petal font-semibold" : "font-medium text-ink-2")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </SiteContainer>
        </nav>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <SiteContainer className="flex flex-wrap justify-between gap-6 py-10 text-[0.9375rem] text-ink-2">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-lg font-bold text-ink">{SALON.name}</span>
          <span>
            {SALON.area} · {SALON.hoursShort}
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link to="/services" className="py-2 text-plum-deep hover:underline">Services</Link>
          <Link to="/book" className="py-2 text-plum-deep hover:underline">Book</Link>
          <Link to="/my-booking" className="py-2 text-plum-deep hover:underline">My booking</Link>
          <Link to="/faq" className="py-2 text-plum-deep hover:underline">FAQs</Link>
          <Link to="/admin/login" className="py-2 text-ink-2 hover:underline">Staff login</Link>
        </nav>
      </SiteContainer>
    </footer>
  );
}

/** Public website shell: header, page content, footer. */
export function SiteLayout() {
  const location = useLocation();

  // new page → start at the top (hash links keep their own scrolling)
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-sans text-ink">
      <a href="#site-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="site-main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
