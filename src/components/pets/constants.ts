import type { BotAvatarType } from "bot-avatars";

export type PetId =
  | "miso"
  | "nova"
  | "pip"
  | "bloom"
  | "brick"
  | "ghosty"
  | "orbit"
  | "sage";

export type HabitatPet = {
  id: PetId;
  name: string;
  type: BotAvatarType;
  seed: number;
  /** Offset from cursor when following (px) */
  followOffset: { x: number; y: number };
};

export const HABITAT_PETS: HabitatPet[] = [
  {
    id: "miso",
    name: "Miso",
    type: "cat",
    seed: 0.11,
    followOffset: { x: -42, y: 52 },
  },
  {
    id: "nova",
    name: "Nova",
    type: "star",
    seed: 0.47,
    followOffset: { x: 8, y: 58 },
  },
  {
    id: "pip",
    name: "Pip",
    type: "clover",
    seed: 0.83,
    followOffset: { x: 48, y: 50 },
  },
  {
    id: "bloom",
    name: "Bloom",
    type: "flower",
    seed: 0.22,
    followOffset: { x: -36, y: 48 },
  },
  {
    id: "brick",
    name: "Brick",
    type: "square",
    seed: 0.61,
    followOffset: { x: 12, y: 54 },
  },
  {
    id: "ghosty",
    name: "Ghosty",
    type: "ghost",
    seed: 0.34,
    followOffset: { x: -28, y: 56 },
  },
  {
    id: "orbit",
    name: "Orbit",
    type: "circle",
    seed: 0.72,
    followOffset: { x: 40, y: 46 },
  },
  {
    id: "sage",
    name: "Sage",
    type: "drop",
    seed: 0.55,
    followOffset: { x: -8, y: 60 },
  },
];

/** Longest prefix wins; `/` matches only the home route. */
export const PET_ROUTE_ASSIGNMENTS: { prefix: string; petId: PetId }[] = [
  { prefix: "/habits", petId: "nova" },
  { prefix: "/settings", petId: "orbit" },
  { prefix: "/stats", petId: "sage" },
  { prefix: "/", petId: "miso" },
];

const PET_BY_ID = new Map(HABITAT_PETS.map((p) => [p.id, p]));

export function petForPathname(pathname: string): HabitatPet | null {
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/offline")
  ) {
    return null;
  }

  const sorted = [...PET_ROUTE_ASSIGNMENTS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );

  for (const { prefix, petId } of sorted) {
    if (prefix === "/") {
      if (pathname === "/") return PET_BY_ID.get(petId) ?? null;
      continue;
    }
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return PET_BY_ID.get(petId) ?? null;
    }
  }

  return null;
}

export function getPet(id: PetId): HabitatPet {
  const pet = PET_BY_ID.get(id);
  if (!pet) throw new Error(`Unknown pet: ${id}`);
  return pet;
}

export const PET_SIZE = 58;
/** Single-room nook dock (bottom-right) */
export const DOCK_WIDTH = 128;
export const DOCK_HEIGHT = 148;
export const DOCK_HEADER = 36;
export const DOCK_MARGIN = 14;
