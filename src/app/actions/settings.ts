"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { dateKey, dbDate, toHabit, toProfile } from "@/lib/serialize";
import type { Profile } from "@/lib/types";
import type { SettingsPreferences } from "@/lib/settings-preferences";
import { parseSettingsPreferences } from "@/lib/settings-preferences";
import {
  buildExportDocument,
  parseImportJson,
  type ImportHabit,
} from "@/lib/import-export";
import type { HabitBehaviorType, HabitInput } from "@/lib/types";
import { eachDayKey, todayKey } from "@/lib/dates";
import { isHabitScheduledOn } from "@/lib/domain/schedule";

import type { ActionResult } from "@/lib/api/types";

export type { ActionResult };

async function guard() {
  await requireAuth();
}

function mergeOnboarding(
  existing: Record<string, unknown>,
  preferences?: Partial<SettingsPreferences>,
): Record<string, unknown> {
  if (!preferences) return existing;
  const currentPrefs = parseSettingsPreferences(existing.preferences);
  return {
    ...existing,
    preferences: { ...currentPrefs, ...preferences },
  };
}

function importToInput(h: ImportHabit): HabitInput {
  const behavior_type: HabitBehaviorType =
    h.kind === "build" ? "build" : "avoid";
  return {
    name: h.name,
    behavior_type,
    start_date: h.start_date,
    color: h.color,
    frequency: h.frequency,
    stack_after: h.stack_after ?? null,
    minimum_version: h.two_minute_version ?? null,
    identity_proof: h.identity_proof ?? null,
  };
}

export async function getProfile(): Promise<Profile> {
  await guard();
  return getOrCreateProfile();
}

export async function updateProfile(input: {
  timezone?: string;
  week_start?: number;
  identity_note?: string | null;
  preferences?: Partial<SettingsPreferences>;
  onboarding?: Record<string, unknown>;
}): Promise<ActionResult<Profile>> {
  try {
    await guard();
    const profile = await getOrCreateProfile();
    const existing = profile.onboarding ?? {};
    let nextOnboarding = existing;
    if (input.onboarding) {
      nextOnboarding = { ...existing, ...input.onboarding };
    }
    if (input.preferences) {
      nextOnboarding = mergeOnboarding(nextOnboarding, input.preferences);
    }
    const onboardingPatch =
      input.onboarding || input.preferences ? nextOnboarding : undefined;

    const row = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        timezone: input.timezone,
        week_start: input.week_start,
        identity_note: input.identity_note,
        ...(onboardingPatch ? { onboarding: onboardingPatch as object } : {}),
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
    const rows = await prisma.habit.findMany({
      include: { logs: true },
      orderBy: { sort_order: "asc" },
    });
    const doc = buildExportDocument(
      rows.map((h) => ({
        name: h.name,
        kind: h.kind as "build" | "quit",
        frequency: h.frequency as "daily" | "weekly",
        start_date: dateKey(h.start_date),
        color: h.color,
        stack_after: h.stack_after,
        two_minute_version: h.two_minute_version,
        identity_proof: h.identity_proof,
        logs: h.logs.map((l) => ({
          log_date: dateKey(l.log_date),
          status:
            l.status === "lapse" || l.status === "relapse"
              ? ("relapse" as const)
              : ("done" as const),
        })),
      })),
    );
    const payload = JSON.stringify(doc, null, 2);
    return { ok: true, data: payload };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Export failed." };
  }
}

export type ImportUserDataResult = {
  imported: number;
  warnings: string[];
};

export async function importUserData(
  rawText: string,
): Promise<ActionResult<ImportUserDataResult>> {
  try {
    await guard();
    const parsed = parseImportJson(rawText);
    if (!parsed.ok) {
      return { ok: false, error: parsed.errors.join(" ") };
    }

    const { doc, warnings } = parsed;
    let imported = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of doc.habits) {
        const input = importToInput(item);
        const tail = await tx.habit.findFirst({
          where: { archived_at: null },
          orderBy: { sort_order: "desc" },
          select: { sort_order: true },
        });
        const behavior = input.behavior_type;
        const created = await tx.habit.create({
          data: {
            name: input.name.trim(),
            kind: item.kind,
            behavior_type: behavior,
            start_date: dbDate(input.start_date),
            color: input.color,
            frequency: input.frequency ?? "daily",
            stack_after: input.stack_after?.trim() || null,
            two_minute_version: input.minimum_version?.trim() || null,
            minimum_version: input.minimum_version?.trim() || null,
            standard_version: input.name.trim(),
            identity_proof: input.identity_proof?.trim() || null,
            sort_order: (tail?.sort_order ?? -1) + 1,
          },
        });
        imported += 1;

        const habit = toHabit(created);
        if (item.kind === "build" && item.missed_dates?.length) {
          const missed = new Set(item.missed_dates);
          const logs = eachDayKey(item.start_date, todayKey())
            .filter((d) => !missed.has(d) && isHabitScheduledOn(habit, d))
            .map((log_date) => ({
              habit_id: created.id,
              log_date: dbDate(log_date),
              status: "completed" as const,
            }));
          if (logs.length) {
            await tx.habitLog.createMany({ data: logs, skipDuplicates: true });
          }
        }
        if (item.kind === "quit" && item.relapse_dates?.length) {
          const logs = item.relapse_dates.map((log_date) => ({
            habit_id: created.id,
            log_date: dbDate(log_date),
            status: "lapse" as const,
          }));
          await tx.habitLog.createMany({ data: logs, skipDuplicates: true });
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/settings");
    revalidatePath("/stats");
    revalidatePath("/calendar");

    return { ok: true, data: { imported, warnings } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Import failed." };
  }
}

export async function clearUserData(): Promise<ActionResult> {
  try {
    await guard();
    await prisma.$transaction([
      prisma.habitLog.deleteMany({}),
      prisma.habit.deleteMany({}),
    ]);
    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/settings");
    revalidatePath("/stats");
    revalidatePath("/calendar");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete data." };
  }
}
