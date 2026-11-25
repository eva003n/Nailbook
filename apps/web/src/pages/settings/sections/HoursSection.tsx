/**
 * §3.3 Hours Settings
 *
 * Day-of-week toggles with open/close time pickers.
 * Uses the BusinessHours API.
 */
import { useState, useEffect } from "react";
import { useBusinessHours, useUpdateBusinessHours } from "../hooks/useBusinessHours";
import type { BusinessHoursEntry } from "../hooks/useBusinessHours";
import { useUiStore } from "@/store/ui.store";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import Toggle from "@/components/ui/Toggle";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function HoursSection() {
  const { data: hours = [], isLoading, error, refetch } = useBusinessHours();
  const updateHours = useUpdateBusinessHours();
  const showToast = useUiStore((s) => s.showToast);

  const [localHours, setLocalHours] = useState<BusinessHoursEntry[]>([]);

  // Sync local state when API data arrives
  useEffect(() => {
    if (hours.length > 0) {
      setLocalHours(hours);
    }
  }, [hours]);

  if (error) return <ErrorState message="Couldn't load business hours." onRetry={refetch} />;

  if (isLoading || localHours.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-(--radius-panel) border border-line bg-surface p-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} shape="text" width="100%" height="32px" />
        ))}
      </div>
    );
  }

  const updateEntry = (dayOfWeek: number, field: "openTime" | "closeTime" | "isActive", value: string | boolean) => {
    setLocalHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
      ),
    );
  };

  const handleSave = () => {
    updateHours.mutate(localHours, {
      onSuccess: () => {
        showToast({ type: "success", message: "Opening hours saved." });
      },
      onError: () => {
        showToast({ type: "error", message: "Couldn't save hours. Check your connection and try again." });
      },
    });
  };

  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const sorted = [...localHours].sort((a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek));

  return (
    <div className="rounded-(--radius-panel) border border-line bg-surface px-5 pt-2 pb-5 md:px-6">
      <ul className="flex flex-col">
        {sorted.map((entry) => {
          const day = DAY_NAMES[entry.dayOfWeek];
          return (
            <li key={entry.dayOfWeek} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-2.5 first:border-t-0">
              <span className="w-24 text-[0.9375rem] font-semibold md:w-28">{day}</span>
              <Toggle
                checked={entry.isActive}
                onChange={(val) => updateEntry(entry.dayOfWeek, "isActive", val)}
                ariaLabel={`Open on ${day}`}
              />
              {entry.isActive ? (
                <span className="flex items-center gap-2">
                  <input
                    type="time"
                    value={entry.openTime}
                    onChange={(e) => updateEntry(entry.dayOfWeek, "openTime", e.target.value)}
                    aria-label={`Opening time on ${day}`}
                    className="h-10 w-36 rounded-[10px] border border-line bg-paper px-3 text-[0.9375rem] font-medium text-ink focus:border-plum focus:outline-none"
                  />
                  <span className="text-sm text-ink-2">to</span>
                  <input
                    type="time"
                    value={entry.closeTime}
                    onChange={(e) => updateEntry(entry.dayOfWeek, "closeTime", e.target.value)}
                    aria-label={`Closing time on ${day}`}
                    className="h-10 w-36 rounded-[10px] border border-line bg-paper px-3 text-[0.9375rem] font-medium text-ink focus:border-plum focus:outline-none"
                  />
                </span>
              ) : (
                <span className="text-[0.9375rem] text-ink-2">Closed</span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button fullWidth={false} loading={updateHours.isPending} onClick={handleSave}>
          Save hours
        </Button>
      </div>
    </div>
  );
}
