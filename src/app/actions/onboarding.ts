"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/profile";
import { updateProfile } from "@/app/actions/settings";
import type { ActionResult } from "@/app/actions/habits";

async function guard() {
  await requireAuth();
}

export type OnboardingStep = "welcome" | "done";

export async function getOnboardingState(): Promise<{
  step: OnboardingStep;
  data: Record<string, unknown>;
}> {
  await guard();
  const profile = await getOrCreateProfile();
  const onboarding = profile.onboarding ?? {};
  const raw = onboarding.step as string | undefined;
  const step: OnboardingStep =
    raw === "done" ? "done" : raw === "welcome" ? "welcome" : "welcome";
  const data = (onboarding.data as Record<string, unknown>) ?? {};
  return { step, data };
}

export async function saveOnboardingProgress(
  step: OnboardingStep,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  await guard();
  return updateProfile({
    onboarding: { step, data, updated_at: new Date().toISOString() },
  }).then((r) => (r.ok ? { ok: true, data: undefined } : r));
}

export async function completeOnboarding(): Promise<ActionResult> {
  const result = await saveOnboardingProgress("done", {});
  if (result.ok) revalidatePath("/");
  return result;
}

export async function skipOnboarding(): Promise<ActionResult> {
  return completeOnboarding();
}
