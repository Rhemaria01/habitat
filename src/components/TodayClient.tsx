"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HabitLogControl } from "@/components/HabitLogControl";
import { LOCALE, parseDateKey } from "@/lib/dates";
import type { TodayHabitItem } from "@/lib/types";

type TodayClientProps = {
  dateKey: string;
  items: TodayHabitItem[];
  weekAdherence: number | null;
  recoveryHint: string | null;
};

export function TodayClient({
  dateKey,
  items,
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
            {scheduled.map(({ habit, log }) => (
              <li
                key={habit.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/habits/${habit.id}`} className="font-medium hover:underline">
                    {habit.name}
                  </Link>
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
    </div>
  );
}
