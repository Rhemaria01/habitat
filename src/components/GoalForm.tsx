"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createGoal, updateGoal } from "@/app/actions/goals";
import { todayKey } from "@/lib/dates";
import type { Goal, GoalInput } from "@/lib/types";

const GOAL_COLORS = ["#A78BFA", "#4FD1A5", "#FF7A8A", "#F5B942", "#6FB3E8"];

type GoalFormProps = {
  goal?: Goal;
  onDone?: () => void;
  compact?: boolean;
};

export function GoalForm({ goal, onDone, compact }: GoalFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [identity, setIdentity] = useState(
    goal?.identity_statement ?? "I am someone who ",
  );
  const [why, setWhy] = useState(goal?.why ?? "");
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: GoalInput = {
      title,
      identity_statement: identity,
      why: why.trim() || null,
      color,
      target_date: targetDate || null,
    };

    startTransition(async () => {
      const result = goal
        ? await updateGoal(goal.id, payload)
        : await createGoal(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (!goal) {
        // Send the user straight to the new goal to add its tasks.
        router.push(`/goals/${result.data.id}`);
        router.refresh();
        return;
      }

      onDone?.();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? "habit-form compact" : "habit-form"}
    >
      <label className="field">
        <span>What&apos;s the goal?</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lose weight"
          required
          maxLength={80}
        />
      </label>

      <label className="field">
        <span>The identity it stands for</span>
        <input
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="I am a healthy person"
          required
          maxLength={120}
        />
        <small className="field-hint">
          Every check-in towards this goal is a vote for this sentence.
        </small>
      </label>

      <label className="field">
        <span>Why does it matter? (optional)</span>
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="So I have energy for long walks and sleep well…"
          rows={3}
          maxLength={400}
        />
      </label>

      <label className="field">
        <span>Target date (optional)</span>
        <input
          type="date"
          value={targetDate ?? ""}
          min={todayKey()}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </label>

      <div className="field">
        <span>Accent</span>
        <div className="color-row">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${color === c ? "selected" : ""}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-btn" disabled={pending}>
        {pending
          ? "Saving…"
          : goal
            ? "Save changes"
            : "Name this goal"}
      </button>
    </form>
  );
}
