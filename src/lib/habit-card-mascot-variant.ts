import type {
  BotAvatarFace,
  BotAvatarGlasses,
  BotAvatarHat,
  BotAvatarShading,
  BotAvatarType,
} from "bot-avatars";
import { botAvatarTypes } from "bot-avatars";

export type HabitCardMascotCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type HabitCardMascotPlacement = {
  habitId: string;
  index: number;
  columns: number;
  total: number;
  layout: "grid" | "list";
};

/** Resolved bot-avatars look for one habit card (stable from habit id). */
export type HabitCardMascotVariant = {
  type: BotAvatarType;
  face: BotAvatarFace;
  shading: BotAvatarShading;
  hat: BotAvatarHat;
  glasses: BotAvatarGlasses;
  headphones: boolean;
  bowTie: boolean;
  seed: number;
  brightness: number;
  saturation: number;
  corner: HabitCardMascotCorner;
};

const FACES: BotAvatarFace[] = ["eyes", "mouth"];
const SHADINGS: BotAvatarShading[] = ["fabric", "plastic", "crisp", "smooth"];
const HATS: BotAvatarHat[] = ["none", "beret", "beanie", "party", "crown"];
const GLASSES: BotAvatarGlasses[] = ["none", "round", "square", "shades"];
const CORNERS: HabitCardMascotCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const BRIGHTNESS_STEPS = [0.88, 1, 1.08, 1.18, 1.28] as const;
const SATURATION_STEPS = [0.95, 1.15, 1.45, 1.72, 2] as const;

function hashHabitId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function pick<T>(items: readonly T[], hash: number, salt: number): T {
  return items[((hash ^ salt) >>> 0) % items.length]!;
}

/** Matches `.habit-grid-dense` breakpoints on the habits page (wide + fullWidth). */
export function habitGridColumnCount(viewportWidth: number): number {
  if (viewportWidth >= 1280) return 4;
  if (viewportWidth >= 960) return 3;
  if (viewportWidth >= 640) return 2;
  return 1;
}

/**
 * Pick a corner on the outer edge of the card — never the corner that points
 * into the grid gutter (avoids mascots clustering between cards).
 */
export function habitCardMascotOuterCorner(
  placement: HabitCardMascotPlacement,
): HabitCardMascotCorner {
  const hash = hashHabitId(placement.habitId);
  const { index, total, layout } = placement;

  if (layout === "list") {
    return pick(["top-left", "top-right"] as const, hash, 0x27d4);
  }

  const cols = Math.max(1, placement.columns);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const maxRow = Math.floor((Math.max(1, total) - 1) / cols);
  const maxCol = cols - 1;

  if (cols === 1) {
    return pick(["top-left", "bottom-left"] as const, hash, 0x27d4);
  }

  if (maxRow === 0) {
    if (col === 0) return pick(["top-left", "bottom-left"] as const, hash, 0x27d4);
    if (col === maxCol) return pick(["top-right", "bottom-right"] as const, hash, 0x27d4);
    return pick(["top-left", "top-right"] as const, hash, 0x27d4);
  }

  if (col === 0) {
    return pick(["top-left", "bottom-left"] as const, hash, 0x27d4);
  }
  if (col === maxCol) {
    return pick(["top-right", "bottom-right"] as const, hash, 0x27d4);
  }

  const gridCenterRow = maxRow / 2;
  const gridCenterCol = maxCol / 2;
  const dr = gridCenterRow - row;
  const dc = gridCenterCol - col;

  const forbidden = new Set<HabitCardMascotCorner>();
  if (dr > 0 && dc > 0) forbidden.add("bottom-right");
  if (dr > 0 && dc < 0) forbidden.add("bottom-left");
  if (dr < 0 && dc > 0) forbidden.add("top-right");
  if (dr < 0 && dc < 0) forbidden.add("top-left");

  const allowed = CORNERS.filter((c) => !forbidden.has(c));
  return pick(allowed.length > 0 ? allowed : CORNERS, hash, 0x27d4);
}

export function habitCardMascotVariant(
  placement: HabitCardMascotPlacement,
): HabitCardMascotVariant {
  const hash = hashHabitId(placement.habitId);

  const type = botAvatarTypes[hash % botAvatarTypes.length]!;
  const face = pick(FACES, hash, 0x9e37);
  const shading = pick(SHADINGS, hash, 0x517c);
  const hat = pick(HATS, hash, 0x85eb);
  const glasses = pick(GLASSES, hash, 0xc2b2);
  const headphones = ((hash >> 7) & 1) === 1;
  const bowTie = ((hash >> 11) & 1) === 1;
  const corner = habitCardMascotOuterCorner(placement);
  const brightness = pick(BRIGHTNESS_STEPS, hash, 0x4a91);
  const saturation = pick(SATURATION_STEPS, hash, 0x6f38);
  const seed = (hash % 997) / 997;

  return {
    type,
    face,
    shading,
    hat,
    glasses,
    headphones,
    bowTie,
    seed,
    brightness,
    saturation,
    corner,
  };
}

export const HABIT_CARD_MASCOT_SIZE = 50;
