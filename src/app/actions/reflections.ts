"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dbDate, toReflection, toWeeklyReview } from "@/lib/serialize";
import type { Reflection, WeeklyReview } from "@/lib/types";
import type { ActionResult } from "./habits";

async function guard() {
  await requireAuth();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function getReflection(
  dateKey: string,
): Promise<Reflection | null> {
  await guard();

  const row = await prisma.reflection.findUnique({
    where: { reflect_date: dbDate(dateKey) },
  });

  return row ? toReflection(row) : null;
}

export async function saveReflection(
  dateKey: string,
  input: { went_well: string; distracted: string; improve_tomorrow: string },
): Promise<ActionResult<Reflection>> {
  try {
    await guard();
    if (!DATE_RE.test(dateKey)) return { ok: false, error: "Invalid date." };

    const clean = {
      went_well: input.went_well.trim().slice(0, 500),
      distracted: input.distracted.trim().slice(0, 500),
      improve_tomorrow: input.improve_tomorrow.trim().slice(0, 500),
    };

    const row = await prisma.reflection.upsert({
      where: { reflect_date: dbDate(dateKey) },
      update: clean,
      create: { reflect_date: dbDate(dateKey), ...clean },
    });

    revalidatePath("/");
    return { ok: true, data: toReflection(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function getWeeklyReview(
  weekStartDate: string,
): Promise<WeeklyReview | null> {
  await guard();

  const row = await prisma.weeklyReview.findUnique({
    where: { week_start_date: dbDate(weekStartDate) },
  });

  return row ? toWeeklyReview(row) : null;
}

export async function saveWeeklyReview(
  weekStartDate: string,
  movedCloser: boolean,
  notes: string,
): Promise<ActionResult<WeeklyReview>> {
  try {
    await guard();
    if (!DATE_RE.test(weekStartDate)) return { ok: false, error: "Invalid date." };

    const row = await prisma.weeklyReview.upsert({
      where: { week_start_date: dbDate(weekStartDate) },
      update: { moved_closer: movedCloser, notes: notes.trim().slice(0, 500) },
      create: {
        week_start_date: dbDate(weekStartDate),
        moved_closer: movedCloser,
        notes: notes.trim().slice(0, 500),
      },
    });

    revalidatePath("/");
    revalidatePath("/goals");
    return { ok: true, data: toWeeklyReview(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}
