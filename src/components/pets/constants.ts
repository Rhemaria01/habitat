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
    followOffset: { x: -78, y: 48 },
  },
  {
    id: "nova",
    name: "Nova",
    type: "star",
    seed: 0.47,
    followOffset: { x: 4, y: 62 },
  },
  {
    id: "pip",
    name: "Pip",
    type: "clover",
    seed: 0.83,
    followOffset: { x: 82, y: 44 },
  },
];

export const PET_SIZE = 58;
/** Vertical tower dock (bottom-right) */
export const DOCK_WIDTH = 128;
export const DOCK_HEIGHT = 318;
export const DOCK_HEADER = 36;
export const DOCK_MARGIN = 14;
