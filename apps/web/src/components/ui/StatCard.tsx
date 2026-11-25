import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  value: string;
  label: string;
  tone?: "default" | "warning" | "error";
  onClick?: () => void;
}

const toneText: Record<string, string> = {
  default: "text-ink",
  warning: "text-plum-deep",
  error: "text-error",
};

/** Single metric tile. Prefer StatStrip for rows of metrics. */
export default function StatCard({ value, label, tone = "default", onClick }: StatCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex flex-col rounded-(--radius-lg) border px-4 py-3.5 text-left ${
        tone === "default" ? "border-line bg-surface" : "border-petal-2 bg-petal"
      }`}
    >
      <span className={`font-display text-[1.625rem] leading-8 font-bold tracking-[-0.02em] tabular-nums ${toneText[tone]}`}>
        {value}
      </span>
      <span className="mt-0.5 text-[0.8125rem] text-ink-2">{label}</span>
    </Tag>
  );
}
