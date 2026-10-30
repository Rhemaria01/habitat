/** Curated emoji set for habit symbols (stored in habit.icon). */

export const HABIT_EMOJIS = [
  "💪",
  "🏃",
  "🚶",
  "🧘",
  "💧",
  "🍎",
  "🥗",
  "☕",
  "🌅",
  "🌙",
  "📚",
  "✍️",
  "🎯",
  "🔥",
  "⭐",
  "💤",
  "🚭",
  "🧠",
  "❤️",
  "🎵",
  "🌿",
  "🦷",
  "🧹",
  "💊",
  "🎨",
  "🧑‍💻",
  "📵",
  "🙏",
  "⚡",
  "🌈",
] as const;

export type HabitEmoji = (typeof HABIT_EMOJIS)[number];

const EMOJI_SET = new Set<string>(HABIT_EMOJIS);

export function isHabitEmoji(value: string | null | undefined): value is HabitEmoji {
  return Boolean(value && EMOJI_SET.has(value));
}
