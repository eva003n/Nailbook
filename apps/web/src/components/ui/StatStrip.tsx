/**
 * StatStrip — one bordered strip of metrics separated by dividers (desktop),
 * collapsing to a 2-column grid on narrow screens. Each stat can link somewhere.
 */
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

export interface StatItem {
  label: string;
  /** Main figure, e.g. "6" or "8,800" */
  value: string;
  /** Small prefix shown before the value, e.g. "KES" */
  unit?: string;
  /** Small pill after the label, e.g. "Needs you" */
  flag?: string;
  /** Percent change; positive renders green up, negative red down */
  trend?: { percent: number; caption?: string };
  highlight?: boolean;
  /** Value is a word/phrase rather than a number: render smaller */
  textValue?: boolean;
  onClick?: () => void;
  extra?: ReactNode;
}

export default function StatStrip({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-2.5 md:flex md:gap-0 md:rounded-(--radius-panel) md:border md:border-line md:bg-surface",
        className,
      )}
    >
      {items.map((s) => {
        const Tag = s.onClick ? "button" : "div";
        const up = (s.trend?.percent ?? 0) >= 0;
        const TrendIcon = up ? TrendingUp : TrendingDown;
        return (
          <Tag
            key={s.label}
            onClick={s.onClick}
            className={clsx(
              "flex min-w-0 flex-1 flex-col rounded-(--radius-lg) border border-line bg-surface px-4 py-3.5 text-left",
              "md:rounded-none md:border-0 md:border-l md:px-6 md:py-5 md:first:border-l-0",
              "md:first:rounded-l-(--radius-panel) md:last:rounded-r-(--radius-panel)",
              s.onClick && "transition-colors hover:bg-paper",
              s.highlight && "border-petal-2 bg-petal md:bg-surface",
            )}
          >
            <span
              className={clsx(
                "font-display font-bold tracking-[-0.02em] tabular-nums",
                s.textValue ? "truncate text-lg leading-8 md:text-[1.375rem] md:leading-9.5" : "text-[1.625rem] leading-8 md:text-[2rem] md:leading-9.5",
                s.highlight ? "text-plum-deep md:text-ink" : "text-ink",
              )}
            >
              {s.unit && <small className="mr-1 text-base font-semibold tracking-normal text-ink-2">{s.unit}</small>}
              {s.value}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.8125rem] text-ink-2 md:mt-1 md:text-[0.9375rem]">
              {s.label}
              {s.flag && (
                <span className="hidden h-5.5 items-center rounded-full bg-petal px-2 text-xs font-bold text-plum-deep md:inline-flex">
                  {s.flag}
                </span>
              )}
              {s.trend && (
                <span className={clsx("inline-flex items-center gap-1 text-[0.8125rem] font-semibold", up ? "text-success" : "text-error")}>
                  <TrendIcon size={14} aria-hidden="true" />
                  {Math.abs(s.trend.percent)}%{s.trend.caption ? ` ${s.trend.caption}` : ""}
                </span>
              )}
              {s.extra}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
