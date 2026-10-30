import type { BotAvatarType } from "bot-avatars";

export type PetId = "miso" | "nova" | "pip";

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
    followOffset: { x: -52, y: 48 },
  },
  {
    id: "nova",
    name: "Nova",
    type: "star",
    seed: 0.47,
    followOffset: { x: 4, y: 56 },
  },
  {
    id: "pip",
    name: "Pip",
    type: "clover",
    seed: 0.83,
    followOffset: { x: 56, y: 44 },
  },
];

const PET_BY_ID = new Map(HABITAT_PETS.map((p) => [p.id, p]));

export function petsEnabledForPath(pathname: string): boolean {
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
