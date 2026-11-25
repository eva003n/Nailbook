/**
 * App shell for all protected routes.
 * < md: content + fixed bottom tab bar.  md+: sidebar (icon-only at md, labelled at lg).
 */
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import OfflineBanner from "./OfflineBanner";

export default function AppShell() {
  return (
    <div className="flex min-h-dvh bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-(--radius-md) bg-plum px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <main
          id="main-content"
          className="flex min-w-0 flex-1 flex-col pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+88px)] md:pb-0"
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
