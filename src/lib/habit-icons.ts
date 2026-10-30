import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  Coffee,
  Dumbbell,
  Droplets,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from "lucide-react";

export const HABIT_ICON_IDS = [
  "dumbbell",
  "footprints",
  "wind",
  "book",
  "leaf",
  "droplets",
  "brain",
  "heart",
  "sun",
  "moon",
  "coffee",
  "apple",
  "pen",
  "music",
  "activity",
  "sparkles",
  "zap",
] as const;

export type HabitIconId = (typeof HABIT_ICON_IDS)[number];

const ICON_MAP: Record<HabitIconId, LucideIcon> = {
  dumbbell: Dumbbell,
  footprints: Footprints,
  wind: Wind,
  book: BookOpen,
  leaf: Leaf,
  droplets: Droplets,
  brain: Brain,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  apple: Apple,
  pen: PenLine,
  music: Music,
  activity: Activity,
  sparkles: Sparkles,
  zap: Zap,
};

export function isHabitIconId(value: string | null | undefined): value is HabitIconId {
  return Boolean(value && (HABIT_ICON_IDS as readonly string[]).includes(value));
}

export function habitIconComponent(id: string | null | undefined): LucideIcon {
  if (isHabitIconId(id)) return ICON_MAP[id];
  return Sparkles;
}

export const DEFAULT_HABIT_ICON: HabitIconId = "sparkles";
