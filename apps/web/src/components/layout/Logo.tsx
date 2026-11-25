import NailSwatch from "@/components/ui/NailSwatch";

/** "nailbook" wordmark with the nail-shaped mark. */
export default function Logo({ size = 22, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 font-display font-bold tracking-[-0.03em] text-ink" style={{ fontSize: size }}>
      <NailSwatch color="var(--color-plum)" width={Math.round(size * 0.7)} height={size} />
      {showWord && <span>nailbook</span>}
    </span>
  );
}
