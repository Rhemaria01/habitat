"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addRoutineStep,
  archiveRoutine,
  createRoutine,
  deleteRoutineStep,
  reorderRoutineSteps,
} from "@/app/actions/routines";
import type { RoutineWithSteps } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoutinesClientProps = {
  routines: RoutineWithSteps[];
  habits: { id: string; name: string }[];
};

export function RoutinesClient({ routines: initial }: RoutinesClientProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState(initial);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function addRoutine() {
    if (!name.trim()) return;
    startTransition(async () => {
      const r = await createRoutine({ name });
      if (r.ok) {
        toast.success("Routine created");
        router.push(`/routines/${r.data.id}`);
      } else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel max-w-md space-y-3">
        <h2>New routine</h2>
        <Label htmlFor="rname">Name</Label>
        <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="button" disabled={pending} onClick={addRoutine}>
          Create
        </Button>
      </section>
      <ul className="space-y-3">
        {routines.map((routine) => (
          <li key={routine.id} className="panel">
            <div className="panel-head">
              <h2>
                <Link href={`/routines/${routine.id}`} className="hover:underline">
                  {routine.name}
                </Link>
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    const r = await archiveRoutine(routine.id);
                    if (r.ok) setRoutines((list) => list.filter((x) => x.id !== routine.id));
                    else toast.error(r.error);
                  })
                }
              >
                Archive
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{routine.steps.length} steps</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

type RoutineDetailClientProps = {
  routine: RoutineWithSteps;
  habits: { id: string; name: string }[];
};

export function RoutineDetailClient({ routine, habits }: RoutineDetailClientProps) {
  const [steps, setSteps] = useState(routine.steps);
  const [title, setTitle] = useState("");
  const [habitId, setHabitId] = useState("");
  const [pending, startTransition] = useTransition();

  function addStep() {
    if (!title.trim()) return;
    startTransition(async () => {
      const r = await addRoutineStep(routine.id, {
        title,
        habit_id: habitId || null,
      });
      if (r.ok) {
        setSteps((s) => [...s, r.data]);
        setTitle("");
        setHabitId("");
      } else toast.error(r.error);
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSteps(next);
    startTransition(async () => {
      await reorderRoutineSteps(
        routine.id,
        next.map((s) => s.id),
      );
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
          >
            <span>
              {index + 1}. {step.title}
              {step.habit_id ? (
                <span className="text-xs text-muted-foreground"> (linked habit)</span>
              ) : null}
            </span>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="outline" onClick={() => moveUp(index)}>
                Up
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteRoutineStep(step.id);
                    if (r.ok) setSteps((s) => s.filter((x) => x.id !== step.id));
                  })
                }
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div className="panel space-y-3">
        <Label>Step title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Label>Link habit (optional)</Label>
        <select
          className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
          value={habitId}
          onChange={(e) => setHabitId(e.target.value)}
        >
          <option value="">Standalone step</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <Button type="button" disabled={pending} onClick={addStep}>
          Add step
        </Button>
      </div>
    </div>
  );
}
