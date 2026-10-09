import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

/**
 * Wraps every authenticated route.
 *
 * The session cookie is httpOnly, so until `/auth/me` resolves (`status === "unknown"`)
 * we show a loading indicator instead of flashing to the login page.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);

  if (status === "unknown") {
    return (
      <div
        className="page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
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
            borderTopColor: "var(--color-accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
