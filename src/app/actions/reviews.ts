"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, todayKey, weekStartKey } from "@/lib/dates";
import { dbDate, toHabitAudit, toReview } from "@/lib/serialize";
import type { HabitAudit, Review } from "@/lib/types";
import type { ActionResult } from "@/app/actions/habits";

async function guard() {
  await requireAuth();
}

export async function listHabitAudits(): Promise<HabitAudit[]> {
  await guard();
  const rows = await prisma.habitAudit.findMany({ orderBy: { sort_order: "asc" } });
  return rows.map(toHabitAudit);
}

export async function saveHabitAudit(
  id: string | null,
  behavior: string,
  classification: HabitAudit["classification"],
  notes: string,
): Promise<ActionResult<HabitAudit>> {
  try {
    await guard();
    if (!behavior.trim()) return { ok: false, error: "Describe the behavior." };
    const row = id
      ? await prisma.habitAudit.update({
          where: { id },
          data: {
            behavior: behavior.trim(),
            classification,
            notes: notes.trim(),
          },
        })
      : await prisma.habitAudit.create({
          data: {
            behavior: behavior.trim(),
            classification,
            notes: notes.trim(),
            sort_order: await prisma.habitAudit.count(),
          },
        });
    revalidatePath("/review");
    return { ok: true, data: toHabitAudit(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
}

export async function deleteHabitAudit(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.habitAudit.delete({ where: { id } });
    revalidatePath("/review");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete." };
  }
}

export async function getReview(
  type: Review["review_type"],
  periodStart: string,
): Promise<Review | null> {
  await guard();
  const row = await prisma.review.findUnique({
    where: {
      review_type_period_start: {
        review_type: type,
        period_start: dbDate(periodStart),
      },
    },
  });
  return row ? toReview(row) : null;
}

export async function saveReview(
  type: Review["review_type"],
  periodStart: string,
  responses: Record<string, unknown>,
  adjustmentNote: string,
): Promise<ActionResult<Review>> {
  try {
    await guard();
    const periodEnd =
      type === "weekly" ? addDays(periodStart, 6) : addDays(periodStart, 27);
    const row = await prisma.review.upsert({
      where: {
        review_type_period_start: {
          review_type: type,
          period_start: dbDate(periodStart),
        },
      },
      update: {
        responses: responses as object,
        adjustment_note: adjustmentNote.trim(),
        period_end: dbDate(periodEnd),
      },
      create: {
        review_type: type,
        period_start: dbDate(periodStart),
        period_end: dbDate(periodEnd),
        responses: responses as object,
        adjustment_note: adjustmentNote.trim(),
      },
    });
    revalidatePath("/review");
    return { ok: true, data: toReview(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save review." };
  }
}

export async function currentWeeklyReview(): Promise<Review | null> {
  const start = weekStartKey(todayKey());
  return getReview("weekly", start);
}

export async function listReviews(limit = 12): Promise<Review[]> {
  await guard();
  const rows = await prisma.review.findMany({
    orderBy: { period_start: "desc" },
    take: limit,
  });
  return rows.map(toReview);
}
