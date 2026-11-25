import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

/** Shown only while offline; cached data stays readable underneath. */
export default function OfflineBanner() {
  const { isOnline } = useOnline();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-20 flex items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-sm font-semibold text-warning"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You're offline. Showing saved data; actions are paused.
    </div>
  );
}
