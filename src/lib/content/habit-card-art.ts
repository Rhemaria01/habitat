/** Fixed catalog of habit card corner illustrations (10 options, no uploads). */

export const HABIT_CARD_ART_KEYS = [
  "sprout",
  "leaf",
  "dumbbell",
  "footprints",
  "bottle",
  "pen",
  "book",
  "candle",
  "moon",
  "star",
] as const;

export type HabitCardArtKey = (typeof HABIT_CARD_ART_KEYS)[number];

export const DEFAULT_HABIT_CARD_ART_KEY: HabitCardArtKey = "sprout";

const HABIT_CARD_ART_LABELS: Record<HabitCardArtKey, string> = {
  sprout: "Sprout",
  leaf: "Fresh air",
  dumbbell: "Weights",
  footprints: "Steps",
  bottle: "Skincare",
  pen: "Writing",
  book: "Reading",
  candle: "Stillness",
  moon: "Night",
  star: "Spark",
};

export type HabitCardArtOption = {
  key: HabitCardArtKey;
  label: string;
  src: string;
};

export const HABIT_CARD_ART_OPTIONS: HabitCardArtOption[] = HABIT_CARD_ART_KEYS.map(
  (key) => ({
    key,
    label: HABIT_CARD_ART_LABELS[key],
    src: `/images/habit-corners/${key}.png`,
  }),
);

const HABIT_CARD_ART_SRC: Record<HabitCardArtKey, string> = Object.fromEntries(
  HABIT_CARD_ART_OPTIONS.map((o) => [o.key, o.src]),
) as Record<HabitCardArtKey, string>;

export function isHabitCardArtKey(value: string): value is HabitCardArtKey {
  return (HABIT_CARD_ART_KEYS as readonly string[]).includes(value);
}

export function habitCardArtSrc(key: HabitCardArtKey): string {
  return HABIT_CARD_ART_SRC[key];
}

export function resolveHabitCardArtSrc(habit: {
  card_art_key: string | null;
}): string {
  if (habit.card_art_key && isHabitCardArtKey(habit.card_art_key)) {
    return habitCardArtSrc(habit.card_art_key);
  }
  return habitCardArtSrc(DEFAULT_HABIT_CARD_ART_KEY);
}

export function habitCardArtKeyForForm(
  habit: { card_art_key: string | null } | undefined,
): HabitCardArtKey {
  if (habit?.card_art_key && isHabitCardArtKey(habit.card_art_key)) {
    return habit.card_art_key;
  }
  return DEFAULT_HABIT_CARD_ART_KEY;
}

export function parseHabitCardArtKey(
  value: string | null | undefined,
): HabitCardArtKey {
  if (value && isHabitCardArtKey(value)) return value;
  return DEFAULT_HABIT_CARD_ART_KEY;
}
