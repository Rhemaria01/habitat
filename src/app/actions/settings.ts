"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { toProfile } from "@/lib/serialize";
import type { Profile } from "@/lib/types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
    const [habits, goals, systems, routines, audits, reviews] = await Promise.all([
      prisma.habit.findMany({ include: { logs: true } }),
      prisma.goal.findMany({ include: { checkins: true, goal_systems: true, goal_habits: true } }),
      prisma.system.findMany(),
      prisma.routine.findMany({ include: { steps: true } }),
      prisma.habitAudit.findMany(),
      prisma.review.findMany(),
    ]);
    const payload = JSON.stringify(
      { exported_at: new Date().toISOString(), habits, goals, systems, routines, audits, reviews },
      null,
      2,
    );
    return { ok: true, data: payload };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Export failed." };
  }
}
