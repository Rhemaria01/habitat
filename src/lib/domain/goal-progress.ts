import type { Goal } from "@/lib/types";

export type GoalProgress = {
  hasMetric: boolean;
  percent: number | null;
  label: string;
};

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function goalProgress(goal: Goal): GoalProgress {
  const baseline = num(goal.baseline_value);
  const target = num(goal.target_value);
  const current = num(goal.current_value);

  if (
    !goal.metric_type ||
    goal.metric_type === "qualitative" ||
    baseline === null ||
    target === null ||
    current === null
  ) {
    return {
      hasMetric: false,
      percent: null,
      label: goal.outcome_definition?.trim() || "Track progress with check-ins and linked systems.",
    };
  }

  const range = target - baseline;
  if (range === 0) {
    return { hasMetric: true, percent: current === target ? 100 : null, label: `${current} ${goal.metric_unit ?? ""}`.trim() };
  }

  const reverse = goal.metric_direction === "decrease";
  const progress = reverse
    ? (baseline - current) / (baseline - target)
    : (current - baseline) / range;

  const clamped = Math.max(0, Math.min(1, progress));
  const percent = Math.round(clamped * 1000) / 10;

  return {
    hasMetric: true,
    percent,
    label: `${current} / ${target} ${goal.metric_unit ?? ""}`.trim(),
  };
}
