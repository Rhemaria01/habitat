import type { HabitBehaviorType, HabitLogStatus } from "@/lib/types";

export const BUILD_LOG_STATUSES: HabitLogStatus[] = [
  "completed",
  "partial",
  "missed",
  "skipped",
];

export const REDUCE_LOG_STATUSES: HabitLogStatus[] = [
  "maintained",
  "lapse",
  "skipped",
];

export function successStatusesFor(behavior: HabitBehaviorType): HabitLogStatus[] {
  if (behavior === "build") return ["completed", "partial"];
  return ["maintained"];
}

export function countsAsMiss(status: HabitLogStatus, behavior: HabitBehaviorType): boolean {
  if (behavior === "build") return status === "missed";
  return status === "lapse";
}

export function countsAsSuccess(status: HabitLogStatus, behavior: HabitBehaviorType): boolean {
  return successStatusesFor(behavior).includes(status);
}
