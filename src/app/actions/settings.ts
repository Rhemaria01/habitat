"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { toProfile } from "@/lib/serialize";
import type { Profile } from "@/lib/types";

import type { ActionResult } from "@/lib/api/types";

export type { ActionResult };

async function guard() {
  await requireAuth();
}

export async function getProfile(): Promise<Profile> {
  await guard();
  return getOrCreateProfile();
}

export async function updateProfile(input: {
  timezone?: string;
  week_start?: number;
  identity_note?: string | null;
  onboarding?: Record<string, unknown>;
}): Promise<ActionResult<Profile>> {
  try {
    await guard();
    const profile = await getOrCreateProfile();
    const row = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        timezone: input.timezone,
        week_start: input.week_start,
        identity_note: input.identity_note,
        onboarding: input.onboarding as object | undefined,
      },
    });
    revalidatePath("/settings");
    revalidatePath("/");
    return { ok: true, data: toProfile(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save settings." };
  }
}

export async function exportUserData(): Promise<ActionResult<string>> {
  try {
    await guard();
    const [habits] = await Promise.all([
      prisma.habit.findMany({ include: { logs: true } }),
    ]);
    const payload = JSON.stringify(
      { exported_at: new Date().toISOString(), habits },
      null,
      2,
    );
    return { ok: true, data: payload };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Export failed." };
  }
}
