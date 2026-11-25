interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/* Tints derived from the plum palette + category swatches */
const TINTS = [
  "bg-avatar-1-bg text-avatar-1-fg",
  "bg-avatar-2-bg text-avatar-2-fg",
  "bg-avatar-3-bg text-avatar-3-fg",
  "bg-avatar-4-bg text-avatar-4-fg",
  "bg-avatar-5-bg text-avatar-5-fg",
];

function tintForName(name: string) {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TINTS[hash % TINTS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-15 w-15 text-xl",
  xl: "h-18 w-18 text-2xl",
};

export default function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${tintForName(name)} ${sizeClasses[size]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
