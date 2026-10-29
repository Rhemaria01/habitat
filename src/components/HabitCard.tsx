"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { toggleHabitDay } from "@/app/actions/habits";
import { todayKey } from "@/lib/dates";
import { computeStreakStats } from "@/lib/streaks";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { HabitLog, HabitWithLogs } from "@/lib/types";

type HabitCardProps = {
  habit: HabitWithLogs;
  index?: number;
  overlay?: boolean;
  /** Set false in filtered views where drag ordering is disabled. */
  sortable?: boolean;
};

function useToggleToday(habit: HabitWithLogs) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const today = todayKey();
  const [logs, setLogs] = useOptimistic(habit.logs);
  const todayActive = logs.some((l) => l.log_date === today);
  const canCheckToday = today >= habit.start_date;

  function onToggleToday() {
    if (!canCheckToday) return;

    startTransition(async () => {
      setLogs((current) => {
        if (todayActive) {
          return current.filter((l) => l.log_date !== today);
        }
        const next: HabitLog = {
          id: `optimistic-${today}`,
          habit_id: habit.id,
          log_date: today,
          status: habit.behavior_type === "build" ? "completed" : "lapse",
          note: null,
          numeric_value: null,
          completion_level: null,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        return [...current.filter((l) => l.log_date !== today), next];
      });

      const result = await toggleHabitDay(
        habit.id,
        habit.behavior_type,
        today,
        todayActive,
      );

      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return { logs, todayActive, canCheckToday, onToggleToday };
}

function CardContent({
  habit,
  logs,
  onToggleToday,
  interactive,
  handleProps,
}: {
  habit: HabitWithLogs;
  logs: HabitLog[];
  onToggleToday?: () => void;
  interactive: boolean;
  handleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const today = todayKey();
  const stats = computeStreakStats(habit.behavior_type, habit.start_date, logs, today);
  const todayActive = logs.some((l) => l.log_date === today);
  const canCheckToday = today >= habit.start_date;

  return (
    <>
      {handleProps ? (
        <button
          type="button"
          className="drag-handle"
          aria-label={`Drag to reorder ${habit.name}`}
          tabIndex={interactive ? 0 : -1}
          {...handleProps}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      ) : null}

      <Link
        href={`/habits/${habit.id}`}
        className="habit-card-main"
        tabIndex={interactive ? 0 : -1}
        onClick={interactive ? undefined : (e) => e.preventDefault()}
      >
        <div className="habit-card-top">
          <span>
            <span className={`kind-chip ${habit.behavior_type}`}>
              {habit.behavior_type}
            </span>
            {habit.frequency === "weekly" ? (
              <span className="freq-chip">Weekly</span>
            ) : null}
          </span>
          <span className="streak-num">
            <RollingNumber value={stats.currentStreak} format={(n) => `${n}`} />
          </span>
        </div>
        <h2>{habit.name}</h2>
        <p className="habit-meta">
          {stats.daysSinceStart} day{stats.daysSinceStart === 1 ? "" : "s"} since{" "}
          {habit.start_date}
        </p>
      </Link>

      {canCheckToday ? (
        <button
          type="button"
          className={`check-btn ${todayActive ? "on" : ""} ${habit.behavior_type}`}
          onClick={onToggleToday}
          aria-pressed={todayActive}
          disabled={!interactive || !onToggleToday}
        >
          {habit.behavior_type === "build"
            ? todayActive
              ? "Undo today"
              : "I did it"
            : todayActive
              ? "Clear slip"
              : "I slipped"}
        </button>
      ) : null}
    </>
  );
}

function PlainHabitCard({
  habit,
  index = 0,
  overlay = false,
}: {
  habit: HabitWithLogs;
  index?: number;
  overlay?: boolean;
}) {
  const { logs, onToggleToday } = useToggleToday(habit);

  return (
    <article
      className={`habit-card ${overlay ? "" : "animate-fade-up"}`}
      style={{
        animationDelay: overlay ? undefined : `${index * 60}ms`,
        ["--habit" as string]: habit.color,
      }}
    >
      <CardContent
        habit={habit}
        logs={overlay ? habit.logs : logs}
        onToggleToday={overlay ? undefined : onToggleToday}
        interactive={!overlay}
      />
    </article>
  );
}

function SortableHabitCard({
  habit,
  index = 0,
}: {
  habit: HabitWithLogs;
  index?: number;
}) {
  const { logs, onToggleToday } = useToggleToday(habit);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  return (
    <article
      ref={setNodeRef}
      className={`habit-card animate-fade-up ${isDragging ? "dragging" : ""}`}
      style={{
        animationDelay: isDragging ? undefined : `${index * 60}ms`,
        ["--habit" as string]: habit.color,
        // Keep layout slot; DragOverlay is the visible card while dragging
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : undefined,
      }}
    >
      <CardContent
        habit={habit}
        logs={logs}
        onToggleToday={onToggleToday}
        interactive
        handleProps={{ ...attributes, ...listeners }}
      />
    </article>
  );
}

export function HabitCard({
  habit,
  index = 0,
  overlay = false,
  sortable = true,
}: HabitCardProps) {
  if (overlay || !sortable) {
    return <PlainHabitCard habit={habit} index={index} overlay={overlay} />;
  }

  return <SortableHabitCard habit={habit} index={index} />;
}
