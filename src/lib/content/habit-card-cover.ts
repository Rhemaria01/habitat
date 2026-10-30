import type { HabitCardArtKey } from "@/lib/content/habit-card-art";
import { habitCardArtKeyForForm } from "@/lib/content/habit-card-art";
import { formatScheduleLabel } from "@/lib/domain/schedule";
import type { Habit } from "@/lib/types";

export const HABIT_CARD_COVER_STYLES = ["corner", "image"] as const;

export type HabitCardCoverStyle = (typeof HABIT_CARD_COVER_STYLES)[number];

export const DEFAULT_HABIT_CARD_COVER_STYLE: HabitCardCoverStyle = "corner";

export const DEFAULT_CREATE_HABIT_COVER_STYLE: HabitCardCoverStyle = "image";

/** Full-bleed background photos (separate from corner illustrations). */
export const HABIT_COVER_IMAGE_KEYS = [
  "morning",
  "afternoon",
  "evening",
  "night",
  "meadow",
  "mist",
  "sidebar",
] as const;

export type HabitCoverImageKey = (typeof HABIT_COVER_IMAGE_KEYS)[number];

export const DEFAULT_HABIT_COVER_IMAGE_KEY: HabitCoverImageKey = "morning";

const COVER_IMAGE_LABELS: Record<HabitCoverImageKey, string> = {
  morning: "Morning light",
  afternoon: "Afternoon hills",
  evening: "Evening glow",
  night: "Night calm",
  meadow: "Open meadow",
  mist: "Soft mist",
  sidebar: "Botanical",
};

const COVER_IMAGE_SRC: Record<HabitCoverImageKey, string> = {
  morning: "/images/scenery-morning.jpg",
  afternoon: "/images/scenery-afternoon.jpg",
  evening: "/images/scenery-evening.jpg",
  night: "/images/scenery-night.jpg",
  meadow: "/images/today-scenery.jpg",
  mist: "/images/scenery-evening.jpg",
  sidebar: "/images/sidebar-motif.jpg",
};

export type HabitCoverImageOption = {
  key: HabitCoverImageKey;
  label: string;
  src: string;
};

export const HABIT_COVER_IMAGE_OPTIONS: HabitCoverImageOption[] =
  HABIT_COVER_IMAGE_KEYS.map((key) => ({
    key,
    label: COVER_IMAGE_LABELS[key],
    src: COVER_IMAGE_SRC[key],
  }));

const COVER_STYLE_LABELS: Record<HabitCardCoverStyle, string> = {
  corner: "Corner art",
  image: "Full cover",
};

export type HabitCardCoverStyleOption = {
  style: HabitCardCoverStyle;
  label: string;
  description: string;
};

export const HABIT_CARD_COVER_STYLE_OPTIONS: HabitCardCoverStyleOption[] = [
  {
    style: "corner",
    label: COVER_STYLE_LABELS.corner,
    description: "Soft illustration in the corner",
  },
  {
    style: "image",
    label: COVER_STYLE_LABELS.image,
    description: "Photo fills the card behind the usual layout",
  },
];

export function isHabitCardCoverStyle(value: string): value is HabitCardCoverStyle {
  return (HABIT_CARD_COVER_STYLES as readonly string[]).includes(value);
}

export function isHabitCoverImageKey(value: string): value is HabitCoverImageKey {
  return (HABIT_COVER_IMAGE_KEYS as readonly string[]).includes(value);
}

/** Maps legacy DB value `object` → corner. */
export function parseHabitCardCoverStyle(
  value: string | null | undefined,
): HabitCardCoverStyle {
  if (value === "object") return "corner";
  if (value && isHabitCardCoverStyle(value)) return value;
  return DEFAULT_HABIT_CARD_COVER_STYLE;
}

export function parseHabitCoverImageKey(
  value: string | null | undefined,
): HabitCoverImageKey {
  if (value && isHabitCoverImageKey(value)) return value;
  return DEFAULT_HABIT_COVER_IMAGE_KEY;
}

export function resolveHabitCardCoverStyle(habit: {
  card_cover_style: string | null;
}): HabitCardCoverStyle {
  return parseHabitCardCoverStyle(habit.card_cover_style);
}

export function resolveHabitCoverImageKey(habit: {
  card_cover_image_key: string | null;
}): HabitCoverImageKey {
  return parseHabitCoverImageKey(habit.card_cover_image_key);
}

export function habitCardCoverKeyForForm(
  habit: { card_cover_style: string | null } | undefined,
): HabitCardCoverStyle {
  return parseHabitCardCoverStyle(habit?.card_cover_style);
}

export function habitCoverImageKeyForForm(
  habit: { card_cover_image_key: string | null } | undefined,
): HabitCoverImageKey {
  return parseHabitCoverImageKey(habit?.card_cover_image_key);
}

export function habitCoverImageSrc(key: HabitCoverImageKey): string {
  return COVER_IMAGE_SRC[key];
}

export type HabitCardPreviewDraft = {
  name: string;
  behavior: import("@/lib/types").HabitBehaviorType;
  color: string;
  icon: string | null;
  cardArtKey: HabitCardArtKey;
  coverStyle: HabitCardCoverStyle;
  coverImageKey: HabitCoverImageKey;
  scheduleLabel: string;
};

export const DEFAULT_HABIT_CARD_PREVIEW_DRAFT: HabitCardPreviewDraft = {
  name: "Morning stretch",
  behavior: "build",
  color: "#8FA992",
  icon: null,
  cardArtKey: "sprout",
  coverStyle: "image",
  coverImageKey: DEFAULT_HABIT_COVER_IMAGE_KEY,
  scheduleLabel: "Every day",
};

export function habitPreviewDraftFromHabit(habit: Habit): HabitCardPreviewDraft {
  return {
    name: habit.name,
    behavior: habit.behavior_type,
    color: habit.color,
    icon: habit.icon,
    cardArtKey: habitCardArtKeyForForm(habit),
    coverStyle: habitCardCoverKeyForForm(habit),
    coverImageKey: habitCoverImageKeyForForm(habit),
    scheduleLabel: formatScheduleLabel(habit) || "Every day",
  };
}
