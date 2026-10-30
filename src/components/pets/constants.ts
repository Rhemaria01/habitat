import type { BotAvatarType } from "bot-avatars";

export type PetId = "miso" | "nova" | "pip";

export type PetAnchorCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Mark the main glass card on a page; mascots anchor to its corners only. */
export const HABITAT_PET_CARD_SELECTOR = "[data-habitat-pet-card]";

export type PetAnchorSpec = {
  corner: PetAnchorCorner;
  /** Nudge from the corner (px); negative pulls under the glass panel. */
  offset: { x: number; y: number };
};

export type HabitatPet = {
  id: PetId;
  name: string;
  type: BotAvatarType;
  seed: number;
  anchor: PetAnchorSpec;
};

export const HABITAT_PETS: HabitatPet[] = [
  {
    id: "miso",
    name: "Miso",
    type: "cat",
    seed: 0.11,
    anchor: {
      corner: "top-right",
      offset: { x: 4, y: 6 },
    },
  },
  {
    id: "nova",
    name: "Nova",
    type: "star",
    seed: 0.47,
    anchor: {
      corner: "top-left",
      offset: { x: -4, y: 6 },
    },
  },
  {
    id: "pip",
    name: "Pip",
    type: "clover",
    seed: 0.83,
    anchor: {
      corner: "bottom-right",
      offset: { x: 6, y: -4 },
    },
  },
];

const PET_BY_ID = new Map(HABITAT_PETS.map((p) => [p.id, p]));

export function petsEnabledForPath(pathname: string): boolean {
  /** Today, habits list, and calendar use page-specific mascots. */
  if (
    pathname === "/" ||
    pathname === "/habits" ||
    pathname === "/calendar" ||
    pathname === "/stats"
  )
    return false;
  return (
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/offline")
  );
}

export function getPet(id: PetId): HabitatPet {
  const pet = PET_BY_ID.get(id);
  if (!pet) throw new Error(`Unknown pet: ${id}`);
  return pet;
}

export const PET_SIZE = 52;
