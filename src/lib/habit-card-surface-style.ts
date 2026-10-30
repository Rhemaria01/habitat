import { habitCardContrastStyle } from "@/lib/color-contrast";
import { resolveHabitCardCoverStyle } from "@/lib/content/habit-card-cover";

export function habitCardSurfaceStyle(
  habit: { color: string; card_cover_style: string | null },
  theme: "light" | "dark",
): Record<string, string> {
  const coverImage = resolveHabitCardCoverStyle(habit) === "image";
  return {
    ["--habit" as string]: habit.color,
    ...habitCardContrastStyle(habit.color, { coverImage, theme }),
  };
}
