"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { archiveGoal, linkHabitToGoal, unlinkHabitFromGoal } from "@/app/actions/goals";
import { toggleHabitDay } from "@/app/actions/habits";
import { FourLawsPanel } from "@/components/FourLawsPanel";
import { GoalForm } from "@/components/GoalForm";
import { HabitForm } from "@/components/HabitForm";
import { ProgressRing } from "@/components/GoalCard";
import { addDays, todayKey } from "@/lib/dates";
import { computeGoalStats, computeStreakStats } from "@/lib/streaks";
import type { GoalWithHabits, HabitLog, HabitWithLogs } from "@/lib/types";

type GoalDetailClientProps = {
  goal: GoalWithHabits;
  /** Habits not yet linked to this goal — offered in the "connect" picker. */
  availableHabits: HabitWithLogs[];
};

function TaskRow({
  habit,
  pendingBusy,
  onBusyChange,
  onRemove,
}: {
  habit: HabitWithLogs;
  pendingBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onRemove?: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [logs, setLogs] = useOptimistic(habit.logs);

  const today = todayKey();
  const yesterday = addDays(today, -1);
  const stats = computeStreakStats(habit.kind, habit.start_date, logs, today);
  const todayActive = logs.some((l) => l.log_date === today);
  const canCheckToday = today >= habit.start_date;
  const wasActiveYesterday = logs.some((l) => l.log_date === yesterday);

  // "Never miss twice" — missed yesterday, still safe if today gets done.
  const nudge =
    habit.kind === "build" &&
    canCheckToday &&
    !todayActive &&
    !wasActiveYesterday &&
    habit.start_date < yesterday;

  function onToggleToday() {
    if (!canCheckToday) return;
    onBusyChange(true);

    startTransition(async () => {
      setLogs((current: HabitLog[]) => {
        if (todayActive) {
          return current.filter((l) => l.log_date !== today);
        }
        const next: HabitLog = {
          id: `optimistic-${today}`,
          habit_id: habit.id,
          log_date: today,
          status: habit.kind === "build" ? "done" : "relapse",
          created_at: new Date().toISOString(),
        };
        return [...current.filter((l) => l.log_date !== today), next];
      });

      const result = await toggleHabitDay(
        habit.id,
        habit.kind,
        today,
        todayActive,
      );
      if (result.ok) router.refresh();
      onBusyChange(false);
    });
  }

  return (
    <li className="task-item">
      <div className="task-row" style={{ ["--habit" as string]: habit.color }}>
        <Link href={`/habits/${habit.id}`} className="task-name">
          {habit.name}
          <span className={`kind-chip ${habit.kind}`}>
            {habit.kind === "build" ? "Good" : "To quit"}
          </span>
        </Link>
        <span className="task-streak">{stats.currentStreak}d</span>
        <button
          type="button"
          className={`check-btn small ${habit.kind} ${todayActive ? "on" : ""}`}
          onClick={onToggleToday}
          disabled={!canCheckToday || pendingBusy}
          aria-pressed={todayActive}
        >
          {habit.kind === "build"
            ? todayActive
              ? "Undo"
              : "Done"
            : todayActive
              ? "Slipped"
              : "Clean"}
        </button>
        {onRemove ? (
          <button
            type="button"
            className="ghost-btn remove-task"
            aria-label={`Remove ${habit.name} from this goal`}
            onClick={onRemove}
            disabled={pendingBusy}
          >
            ×
          </button>
        ) : null}
      </div>
      {nudge ? (
        <p className="nudge">
          Yesterday slipped — the streak is still safe. Never miss twice.
        </p>
      ) : null}
    </li>
  );
}

export function GoalDetailClient({
  goal,
  availableHabits,
}: GoalDetailClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyTask, setBusyTask] = useState(false);
  const [managing, setManaging] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editing, setEditing] = useState(false);

  const stats = computeGoalStats(goal.habits);
  const hasQuitTasks = goal.habits.some((h) => h.kind === "quit");
  const hasBuildTasks = goal.habits.some((h) => h.kind === "build");

  function onLink(habitId: string) {
    setError(null);
    startTransition(async () => {
      const result = await linkHabitToGoal(goal.id, habitId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setManaging(true);
      router.refresh();
    });
  }

  function onUnlink(habitId: string) {
    setError(null);
    startTransition(async () => {
      const result = await unlinkHabitFromGoal(goal.id, habitId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onArchive() {
    if (!confirm(`Archive “${goal.title}”? Its habits stay in your list.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveGoal(goal.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/goals");
      router.refresh();
    });
  }

  const busy = pending || busyTask;

  return (
    <div className="detail" style={{ ["--goal" as string]: goal.color }}>
      <Link href="/goals" className="back-link animate-fade-up">
        ← All goals
      </Link>

      <section className="detail-hero animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="goal-hero-top">
          <h1>{goal.title}</h1>
          <ProgressRing percent={stats.percent} />
        </div>
        {goal.target_date ? (
          <p className="detail-since">Target: {goal.target_date}</p>
        ) : null}
        <p className="goal-taskcount">
          {stats.total === 0
            ? "No tasks yet — add the habits that prove this identity"
            : `${stats.kept}/${stats.total} tasks moved this week · ${stats.votes} identity votes`}
        </p>
      </section>

      <div className="identity-banner animate-fade-up" style={{ animationDelay: "80ms" }}>
        <p>“{goal.identity_statement}”</p>
        <small>
          {goal.why
            ? `${goal.why} — `
            : ""}
          Every check-in below is a vote for this sentence.
        </small>
      </div>

      <section className="panel animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="panel-head">
          <h2>Tasks</h2>
          <div className="head-actions">
            <button
              type="button"
              className={`ghost-btn ${managing ? "active" : ""}`}
              onClick={() => setManaging((v) => !v)}
            >
              {managing ? "Done managing" : "Manage"}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowAddTask((v) => !v)}
            >
              {showAddTask ? "Hide" : "+ Task"}
            </button>
          </div>
        </div>

        {goal.habits.length === 0 && !showAddTask ? (
          <p className="grid-hint">
            Goals need evidence. Add the daily (or weekly) habits that prove
            you&apos;re this person.
          </p>
        ) : (
          <ul className="task-list">
            {goal.habits.map((habit) => (
              <TaskRow
                key={habit.id}
                habit={habit}
                pendingBusy={busy}
                onBusyChange={setBusyTask}
                onRemove={
                  managing ? () => onUnlink(habit.id) : undefined
                }
              />
            ))}
          </ul>
        )}

        {showAddTask ? (
          <div className="goal-subpanel">
            <HabitForm
              goals={[goal]}
              defaultGoalId={goal.id}
              onDone={() => setShowAddTask(false)}
              compact
            />
          </div>
        ) : managing && availableHabits.length > 0 ? (
          <div className="link-manage" style={{ marginTop: "0.9rem" }}>
            <p className="grid-hint" style={{ margin: 0 }}>
              Connect an existing habit as a task:
            </p>
            <ul className="link-pick">
              {availableHabits.map((habit) => (
                <li key={habit.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onLink(habit.id)}
                  >
                    <span
                      className="pick-dot"
                      style={{ background: habit.color }}
                      aria-hidden
                    />
                    {habit.name}
                    <span className={`kind-chip ${habit.kind}`}>
                      {habit.kind === "build" ? "Good" : "To quit"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="panel animate-fade-up" style={{ animationDelay: "160ms" }}>
        <div className="panel-head">
          <h2>Atomic Habits helper</h2>
        </div>
        {hasBuildTasks && hasQuitTasks ? (
          <>
            <FourLawsPanel mode="build" />
            <FourLawsPanel mode="quit" />
          </>
        ) : (
          <FourLawsPanel mode={hasQuitTasks && goal.habits.length > 0 ? "quit" : "build"} />
        )}
      </section>

      <section className="panel animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="panel-head">
          <h2>{editing ? "Edit goal" : "The goal itself"}</h2>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>

        {editing ? (
          <GoalForm goal={goal} onDone={() => setEditing(false)} />
        ) : (
          <button
            type="button"
            className="danger-btn"
            onClick={onArchive}
            disabled={pending}
          >
            {pending ? "Archiving…" : "Archive goal"}
          </button>
        )}
      </section>
    </div>
  );
}
