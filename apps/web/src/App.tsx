/**
 * App root — routes, providers, lazy loading
 *
 * §7.1: No full-page spinners — skeleton loading only.
 * §10: Skip-to-content link enabled.
 */
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth.store";
import { useSSE } from "@/hooks/useSSE";
import { useUiStore } from "@/store/ui.store";
import { useThemeSync } from "@/lib/theme";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import ToastContainer from "@/components/ui/Toast";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  ServiceWorkerProvider,
  useServiceWorkerContext,
} from "@/hooks/useServiceWorkerContext";

const ReactQueryDevTools = lazy(() =>
  import("@tanstack/react-query-devtools").then((module) => ({
    default: module.ReactQueryDevtools,
  })),
);
/*______________ Lazy loaded pages ________________ */
const Login = lazy(() => import("./pages/Login"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const BookingsPage = lazy(() => import("./pages/bookings/BookingsPage"));
const BookingDetailPage = lazy(
  () => import("./pages/bookings/BookingDetailPage"),
);
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const CustomerDetailPage = lazy(
  () => import("./pages/customers/CustomerDetailPage"),
);
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage"));
const PaymentDetailPage = lazy(
  () => import("./pages/payments/PaymentDetailPage"),
);
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const NotificationsPage = lazy(
  () => import("./pages/notifications/NotificationsPage"),
);
const RescheduleBookingPage = lazy(() => import("@/pages/bookings/RescheduleBookingPage"));
const CreateBookingPage = lazy(
  () => import("@/pages/bookings/CreateBookingPage"),
); ;


/*______________ Public website (named exports) ________________ */
const HomePage = lazy(() => import("@/pages/site/HomePage").then((m) => ({ default: m.HomePage })));
const ServicesPage = lazy(() => import("@/pages/site/ServicesPage").then((m) => ({ default: m.ServicesPage })));
const BookPage = lazy(() => import("@/pages/site/BookPage").then((m) => ({ default: m.BookPage })));
const FaqPage = lazy(() => import("@/pages/site/FaqPage").then((m) => ({ default: m.FaqPage })));
const MyBookingPage = lazy(() => import("@/pages/site/MyBookingPage").then((m) => ({ default: m.MyBookingPage })));
const NotFoundPage = lazy(() => import("@/pages/site/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

import { SiteLayout } from "@/components/site/SiteLayout";
import PublicRoute from "@/components/layout/PublicRoute";
import { InstallPromptProvider } from "./hooks/useInstallPrompt";
import ServiceWorkerPrompt from "@/components/ui/ServiceWorkerPrompt";
// import OfflineFallback from "@/components/OfflineFallback";
// import { useOnline } from "./hooks/useOnline";


/**
 * §7.1: Minimal loading indicator — NOT a full-page spinner.
 * Uses the .page class for safe area and a subtle centered pulse.
 */
function PageFallback() {
  return (
    <div
      className="page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
      }}
    >
      <div
        aria-label="Loading"
        role="status"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-full)",
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-plum)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Wrap a routed page in its error boundary + lazy-load fallback. */
function page(element: React.ReactNode, fallback: React.ReactNode = <PageFallback />) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>{element}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Calls `GET /auth/me` once on mount to check whether the httpOnly session
 * cookie is still valid. Route guards wait on `status` until this resolves.
 */
function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return null;
}

function AppSSEProvider({ children }: { children: React.ReactNode }) {
  useSSE();
  return <>{children}</>;
}

const isDevMode = import.meta.env.DEV;

function AppInner() {
  const { setRegistration, setRegistrationError } = useServiceWorkerContext();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swScriptUrl, registration) {
      if (registration) {
        setRegistration(registration);
      }
      if (isDevMode) {
        console.log("Service worker registered", registration);
      }
    },
    onRegisterError(error) {
      setRegistrationError(
        error instanceof Error ? error : new Error(String(error)),
      );
      if (isDevMode) {
        console.error("Service worker registration failed", error);
      }
    },

    onOfflineReady() {
      setOfflineReady(true);
         if (isDevMode)  console.log("Service worker went offline");
    },

    onNeedRefresh() {
      setNeedRefresh(true);
      if (isDevMode) {
        console.log("Worker waiting to move to activation");
      }
    },
  });

  return (
    <>
      <ToastContainer />

      <ServiceWorkerPrompt
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        onReload={() => updateServiceWorker(true)}
      />
      <Routes>
        {/* Public customer website */}
        <Route element={<SiteLayout />}>
          <Route index element={page(<HomePage />)} />
          <Route path="services" element={page(<ServicesPage />)} />
          <Route path="book" element={page(<BookPage />)} />
          <Route path="faq" element={page(<FaqPage />)} />
          <Route path="my-booking" element={page(<MyBookingPage />)} />
          <Route path="*" element={page(<NotFoundPage />)} />
        </Route>

        {/* Staff app */}
        <Route
          path="/admin/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppSSEProvider>
                <InstallPromptProvider>
                  <AppShell />
                </InstallPromptProvider>
              </AppSSEProvider>
            </ProtectedRoute>
          }
        >
          {[
            { path: "dashboard", element: <DashboardPage /> },
            { path: "payments", element: <PaymentsPage /> },
            { path: "payments/:id", element: <PaymentDetailPage /> },
            { path: "settings", element: <SettingsPage /> },
            { path: "notifications", element: <NotificationsPage /> },
          ].map(({ path, element }) => (
            <Route key={path} path={path} element={page(element)} />
          ))}

          {/* List + detail: detail routes render inside the list page's <Outlet /> */}
          <Route path="bookings" element={page(<BookingsPage />)}>
            <Route path="new" element={page(<CreateBookingPage />, null)} />
            <Route path=":id" element={page(<BookingDetailPage />)}>
              <Route path="reschedule" element={page(<RescheduleBookingPage />, null)} />
            </Route>
          </Route>
          <Route path="customers" element={page(<CustomersPage />)}>
            <Route path=":id" element={page(<CustomerDetailPage />)} />
          </Route>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  useThemeSync(useUiStore((s) => s.theme));
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        {import.meta.env.DEV && <ReactQueryDevTools />}
      </Suspense>
      <AuthInitializer />
      <ServiceWorkerProvider>
        <BrowserRouter>
          {/* <AppSSEProvider> */}
          <AppInner />
          {/* </AppSSEProvider> */}
        </BrowserRouter>
      </ServiceWorkerProvider>
    </QueryClientProvider>
  );
}
