import type { BotAvatarType } from "bot-avatars";

/** Stationary mascot on the Stats insights card (does not follow the cursor). */
export const STATS_INSIGHT_PET = {
  name: "Ember",
  type: "droid" satisfies BotAvatarType,
  seed: 0.29,
} as const;

export const STATS_INSIGHT_PET_SIZE = 72;
