import { useRef } from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui";
import { useUiStore } from "@/store/ui.store";
import { THEME_OPTIONS } from "@/lib/themeOptions";

export function AppearanceSection() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Radio-group arrow-key behaviour */
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    setTheme(THEME_OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <Card>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2.5">
        {THEME_OPTIONS.map((opt, i) => {
          const on = theme === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => setTheme(opt.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={clsx(
                "flex min-h-11 flex-col items-center gap-1.5 rounded-(--radius-lg) border px-2 py-3.5 text-center transition-colors",
                on ? "border-plum bg-petal text-ink" : "border-line bg-surface text-ink-2 hover:border-mauve hover:text-ink",
              )}
            >
              <Icon size={20} aria-hidden="true" className={on ? "text-plum-deep" : undefined} />
              <span className="text-[0.9375rem] font-semibold">{opt.label}</span>
              <span className="hidden text-xs text-ink-2 sm:block">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
