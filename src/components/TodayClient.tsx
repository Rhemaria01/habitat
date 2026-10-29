"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HabitLogControl } from "@/components/HabitLogControl";
import { LOCALE, parseDateKey } from "@/lib/dates";
import type { RoutineStepLog, TodayHabitItem, RoutineWithSteps } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toggleRoutineStep } from "@/app/actions/today";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type TodayClientProps = {
  dateKey: string;
  items: TodayHabitItem[];
  routines: RoutineWithSteps[];
  stepLogs: RoutineStepLog[];
  weekAdherence: number | null;
  recoveryHint: string | null;
};

export function TodayClient({
  dateKey,
  items,
  routines,
  stepLogs,
  weekAdherence,
  recoveryHint,
}: TodayClientProps) {
  const prettyDate = parseDateKey(dateKey).toLocaleDateString(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const scheduled = items.filter((i) => i.scheduled);
  const doneCount = scheduled.filter((i) => i.log && i.log.status !== "missed" && i.log.status !== "lapse").length;

  return (
    <div className="today space-y-6">
      <section className="today-head">
        <h1>Today</h1>
        <p className="today-date">{prettyDate}</p>
        {weekAdherence !== null ? (
          <p className="panel-meta mt-2">
            This week: {weekAdherence}% adherence across active habits
          </p>
        ) : null}
        {recoveryHint ? (
          <div className="panel mt-4 border-l-2 border-primary pl-4">
            <p className="text-sm text-muted-foreground">{recoveryHint}</p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Habits</h2>
          <Link href="/habits/new" className="panel-meta inline-flex items-center gap-1">
            New habit <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <p className="grid-hint mb-4">
          {doneCount} logged · {scheduled.length} scheduled today. Unlogged days are not counted as misses until you choose.
        </p>
        {scheduled.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No habits scheduled for today.{" "}
            <Link href="/habits/new" className="underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {scheduled.map(({ habit, log, routineNames }) => (
              <li
                key={habit.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/habits/${habit.id}`} className="font-medium hover:underline">
                    {habit.name}
                  </Link>
                  {routineNames.length ? (
                    <p className="text-xs text-muted-foreground">
                      Routines: {routineNames.join(", ")}
                    </p>
                  ) : null}
                  {habit.time_window ? (
                    <p className="text-xs text-muted-foreground capitalize">
                      {habit.time_window}
                      {habit.planned_time ? ` · ${habit.planned_time}` : ""}
                    </p>
                  ) : null}
                </div>
                <HabitLogControl
                  habitId={habit.id}
                  behavior={habit.behavior_type}
                  logDate={dateKey}
                  log={log}
                  scheduled
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {routines.map((routine) => (
        <RoutineTodaySection
          key={routine.id}
          routine={routine}
          dateKey={dateKey}
          stepLogs={stepLogs}
        />
      ))}
    </div>
  );
}

function RoutineTodaySection({
  routine,
  dateKey,
  stepLogs,
}: {
  routine: RoutineWithSteps;
  dateKey: string;
  stepLogs: RoutineStepLog[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const doneSet = new Set(
    stepLogs.filter((l) => l.log_date === dateKey && l.done).map((l) => l.routine_step_id),
  );

  function toggleStep(stepId: string, done: boolean) {
    startTransition(async () => {
      const result = await toggleRoutineStep(stepId, dateKey, done);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{routine.name}</h2>
        <Link href={`/routines/${routine.id}`} className="panel-meta">
          Edit routine
        </Link>
      </div>
      <ol className="space-y-2">
        {routine.steps.map((step) => {
          const done = doneSet.has(step.id);
          return (
            <li
              key={step.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className={done ? "line-through text-muted-foreground" : ""}>
                {step.title}
                {step.is_optional ? (
                  <span className="text-xs text-muted-foreground"> (optional)</span>
                ) : null}
              </span>
              <Button
                type="button"
                size="sm"
                variant={done ? "secondary" : "outline"}
                onClick={() => toggleStep(step.id, !done)}
              >
                {done ? "Undo" : "Done"}
              </Button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
