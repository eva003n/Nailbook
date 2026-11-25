interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className="inline-flex gap-0.5 rounded-(--radius-md) bg-petal p-1"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            min-h-9 rounded-[9px] px-4 text-sm font-semibold transition-colors
            ${value === opt.value ? "bg-surface text-ink shadow-(--shadow-seg)" : "text-ink-2 hover:text-ink"}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
