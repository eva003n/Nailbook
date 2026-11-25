import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import type { ThemePreference } from "@/lib/theme";

export const THEME_OPTIONS: { value: ThemePreference; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", hint: "Always light", icon: Sun },
  { value: "dark", label: "Dark", hint: "Always dark", icon: Moon },
  { value: "system", label: "System", hint: "Match this device", icon: Monitor },
];
