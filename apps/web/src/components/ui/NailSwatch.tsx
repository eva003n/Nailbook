/** Nail-shaped colour swatch (rounded top, squarer base) — the Nailbook motif. */
interface NailSwatchProps {
  color: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function NailSwatch({ color, width = 10, height = 14, className }: NailSwatchProps) {
  return <span aria-hidden="true" className={`nail ${className ?? ""}`} style={{ width, height, background: color }} />;
}
