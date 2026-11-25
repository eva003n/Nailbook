import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge aware of our custom font-size tokens (text-md, text-2xs) so they aren't mistaken for colours. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: ["md", "2xs"] },
  },
});

/** Merge class names; later Tailwind utilities override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
