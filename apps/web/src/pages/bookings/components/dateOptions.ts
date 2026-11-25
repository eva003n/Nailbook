/** Next N days as date-strip options (ISO date + short labels). */
export interface DateOption {
  iso: string;
  weekday: string;
  day: string;
}

export function nextDays(count = 7): DateOption[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString("en-KE", { weekday: "short" }),
      day: d.toLocaleDateString("en-KE", { day: "numeric" }),
    };
  });
}
