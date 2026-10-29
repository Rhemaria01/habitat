"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createGoal, updateGoal } from "@/app/actions/goals";
import { todayKey } from "@/lib/dates";
import type { Goal, GoalInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const GOAL_COLORS = ["#A78BFA", "#4FD1A5", "#5E6AD2", "#F0B429", "#6FB3E8"];

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
        toast.error(result.error);
        return;
      }

      if (!goal) {
        // Send the user straight to the new goal to add its tasks.
        toast.success(`“${result.data.title}” named.`);
        router.push(`/goals/${result.data.id}`);
        router.refresh();
        return;
      }

      toast.success("Goal updated.");
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`habit-form flex flex-col gap-4 ${compact ? "compact" : ""}`}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-title">What&apos;s the goal?</Label>
        <Input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lose weight"
          required
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-identity">The identity it stands for</Label>
        <Input
          id="goal-identity"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="I am a healthy person"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Every check-in towards this goal is a vote for this sentence.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-why">Why does it matter? (optional)</Label>
        <Textarea
          id="goal-why"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="So I have energy for long walks and sleep well…"
          rows={3}
          maxLength={400}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-target">Target date (optional)</Label>
        <Input
          id="goal-target"
          type="date"
          value={targetDate ?? ""}
          min={todayKey()}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Accent</Label>
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

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Saving…"
          : goal
            ? "Save changes"
            : "Name this goal"}
      </Button>
    </form>
  );
}
