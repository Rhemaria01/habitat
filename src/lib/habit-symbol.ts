import { isHabitEmoji } from "@/lib/habit-emojis";
import { isHabitIconId } from "@/lib/habit-icons";

export function isHabitSymbol(value: string | null | undefined): boolean {
  return isHabitIconId(value) || isHabitEmoji(value);
}

export function normalizeHabitSymbol(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  return isHabitSymbol(trimmed) ? trimmed : null;
}
