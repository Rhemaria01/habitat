import {
  habitCardArtSrc,
  type HabitCardArtKey,
} from "@/lib/content/habit-card-art";

export const HABIT_CARD_COVER_STYLES = ["corner", "image", "object"] as const;

export type HabitCardCoverStyle = (typeof HABIT_CARD_COVER_STYLES)[number];

export const DEFAULT_HABIT_CARD_COVER_STYLE: HabitCardCoverStyle = "corner";

const COVER_STYLE_LABELS: Record<HabitCardCoverStyle, string> = {
  corner: "Corner art",
  image: "Full cover",
  object: "Hero object",
};

/** Scenic photos — full-bleed card backgrounds per illustration theme. */
const COVER_PHOTO_BY_ART: Record<HabitCardArtKey, string> = {
  sprout: "/images/scenery-morning.jpg",
  leaf: "/images/scenery-afternoon.jpg",
  dumbbell: "/images/scenery-evening.jpg",
  footprints: "/images/today-scenery.jpg",
  bottle: "/images/scenery-night.jpg",
  pen: "/images/scenery-morning.jpg",
  book: "/images/scenery-afternoon.jpg",
  candle: "/images/scenery-night.jpg",
  moon: "/images/scenery-night.jpg",
  star: "/images/scenery-evening.jpg",
};

/** Procedural mesh accents per art key (object mode). */
const OBJECT_MESH_BY_ART: Record<HabitCardArtKey, string> = {
  sprout: "mesh-sprout",
  leaf: "mesh-leaf",
  dumbbell: "mesh-dumbbell",
  footprints: "mesh-footprints",
  bottle: "mesh-bottle",
  pen: "mesh-pen",
  book: "mesh-book",
  candle: "mesh-candle",
  moon: "mesh-moon",
  star: "mesh-star",
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
    description: "Photo fills the card with text overlay",
  },
  {
    style: "object",
    label: COVER_STYLE_LABELS.object,
    description: "Gradient scene with a centered object",
  },
];

export function isHabitCardCoverStyle(value: string): value is HabitCardCoverStyle {
  return (HABIT_CARD_COVER_STYLES as readonly string[]).includes(value);
}

export function parseHabitCardCoverStyle(
  value: string | null | undefined,
): HabitCardCoverStyle {
  if (value && isHabitCardCoverStyle(value)) return value;
  return DEFAULT_HABIT_CARD_COVER_STYLE;
}

export function resolveHabitCardCoverStyle(habit: {
  card_cover_style: string | null;
}): HabitCardCoverStyle {
  return parseHabitCardCoverStyle(habit.card_cover_style);
}

export function habitCardCoverKeyForForm(
  habit: { card_cover_style: string | null } | undefined,
): HabitCardCoverStyle {
  return parseHabitCardCoverStyle(habit?.card_cover_style);
}

export function habitCardCoverPhotoSrc(artKey: HabitCardArtKey): string {
  return COVER_PHOTO_BY_ART[artKey];
}

export function habitCardCoverObjectMeshClass(artKey: HabitCardArtKey): string {
  return OBJECT_MESH_BY_ART[artKey];
}

export function habitCardCoverObjectArtSrc(artKey: HabitCardArtKey): string {
  return habitCardArtSrc(artKey);
}

export type HabitCardPreviewDraft = {
  name: string;
  behavior: import("@/lib/types").HabitBehaviorType;
  color: string;
  icon: string | null;
  cardArtKey: HabitCardArtKey;
  coverStyle: HabitCardCoverStyle;
  scheduleLabel: string;
};

export const DEFAULT_HABIT_CARD_PREVIEW_DRAFT: HabitCardPreviewDraft = {
  name: "Morning stretch",
  behavior: "build",
  color: "#8FA992",
  icon: null,
  cardArtKey: "sprout",
  coverStyle: "image",
  scheduleLabel: "Every day",
};
