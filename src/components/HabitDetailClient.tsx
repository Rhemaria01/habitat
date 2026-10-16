"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteHabit } from "@/app/actions/habits";
import { CheckInButton } from "@/components/CheckInButton";
import { HabitForm } from "@/components/HabitForm";
import { Heatmap } from "@/components/Heatmap";
import { MonthCalendar } from "@/components/MonthCalendar";
import { formatLongDate } from "@/lib/dates";
import { computeStreakStats } from "@/lib/streaks";
import type { HabitWithLogs } from "@/lib/types";

type HabitDetailClientProps = {
  habit: HabitWithLogs;
};

type View = "month" | "year";

export function HabitDetailClient({ habit }: HabitDetailClientProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const stats = computeStreakStats(habit.kind, habit.start_date, habit.logs);

  function onDelete() {
    if (!confirm(`Delete “${habit.name}”? This can’t be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteHabit(habit.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/habits");
      router.refresh();
    });
  }

  const hasFineTuning =
    habit.frequency === "weekly" ||
    habit.stack_after ||
    habit.two_minute_version ||
    habit.identity_proof;

  return (
    <div className="detail">
      <Link href="/habits" className="back-link animate-fade-up">
        ← All habits
      </Link>

      <section
        className="detail-hero animate-fade-up"
        style={{ animationDelay: "40ms", ["--habit" as string]: habit.color }}
      >
        <span className={`kind-chip ${habit.kind}`}>
          {habit.kind === "build" ? "Growing" : "Quitting"}
        </span>
        {habit.frequency === "weekly" ? (
          <span className="freq-chip">Weekly</span>
        ) : null}
        <h1>{habit.name}</h1>
        <p className="detail-since">
          Since {formatLongDate(habit.start_date)} · {stats.daysSinceStart} day
          {stats.daysSinceStart === 1 ? "" : "s"}
        </p>

        <div className="streak-board">
          <div>
            <strong className="animate-pop">{stats.currentStreak}</strong>
            <span>Current streak</span>
          </div>
          <div>
            <strong>{stats.bestStreak}</strong>
            <span>Best streak</span>
          </div>
        </div>

        <CheckInButton
          habitId={habit.id}
          kind={habit.kind}
          startDate={habit.start_date}
          logs={habit.logs}
        />
      </section>

      {hasFineTuning ? (
        <section
          className="panel habit-fine-tuning animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="panel-head">
            <h2>How it&apos;s built</h2>
          </div>
          {habit.stack_after ? (
            <p className="tuning-line">
              <span>Stack</span>After I {habit.stack_after.replace(/^after\s+i\s+/i, "")}, I
              will {habit.name.toLowerCase()}.
            </p>
          ) : null}
          {habit.two_minute_version ? (
            <p className="tuning-line">
              <span>2-Minute version</span>
              {habit.two_minute_version}
            </p>
          ) : null}
          {habit.identity_proof ? (
            <p className="tuning-line">
              <span>Identity vote</span>
              {habit.identity_proof}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="panel-head">
          <h2>History</h2>
        </div>
        <div className="view-tabs" role="tablist" aria-label="History view">
          <button
            type="button"
            className={`view-tab ${view === "month" ? "active" : ""}`}
            onClick={() => setView("month")}
          >
            Month calendar
          </button>
          <button
            type="button"
            className={`view-tab ${view === "year" ? "active" : ""}`}
            onClick={() => setView("year")}
          >
            Year map
          </button>
        </div>

        {view === "month" ? (
          <MonthCalendar
            habitId={habit.id}
            kind={habit.kind}
            startDate={habit.start_date}
            logs={habit.logs}
          />
        ) : (
          <Heatmap
            habitId={habit.id}
            kind={habit.kind}
            color={habit.color}
            startDate={habit.start_date}
            logs={habit.logs}
          />
        )}
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "180ms" }}
      >
        <div className="panel-head">
          <h2>{editing ? "Edit habit" : "Care"}</h2>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>

        {editing ? (
          <HabitForm
            habit={habit}
            onDone={() => setEditing(false)}
            compact
          />
        ) : (
          <button
            type="button"
            className="danger-btn"
            onClick={onDelete}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete habit"}
          </button>
        )}
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  );
}
