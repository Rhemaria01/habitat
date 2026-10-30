"use client";

import Link from "next/link";
import { useOptimistic, type HTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Flame, MoreVertical } from "lucide-react";
import { HabitIcon } from "@/components/HabitIcon";
import { useToggleHabitDayMutation } from "@/hooks/api/use-mutations";
import { addDays, todayKey } from "@/lib/dates";
import { formatScheduleLabel } from "@/lib/domain/schedule";
import { computeStreakStats } from "@/lib/streaks";
import { AnimatedHabitCard } from "@/components/animated/AnimatedHabitCard";
import { HabitCardCornerArt } from "@/components/HabitCardCornerArt";
import { resolveHabitCardArtSrc } from "@/lib/content/habit-card-art";
import type { HabitBehaviorType, HabitLog, HabitWithLogs } from "@/lib/types";
import { cn } from "@/lib/utils";

type HabitCardProps = {
  habit: HabitWithLogs;
  index?: number;
  overlay?: boolean;
  sortable?: boolean;
  layout?: "grid" | "list";
};

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function behaviorLabel(type: HabitBehaviorType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function weekDots(habit: HabitWithLogs, logs: HabitLog[]) {
  const today = todayKey();
  const days: { label: string; on: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = addDays(today, -i);
    const d = new Date(`${key}T12:00:00`).getDay();
    const label = WEEK_LABELS[(d + 6) % 7];
    const log = logs.find((l) => l.log_date === key);
    const on =
      habit.behavior_type === "build"
        ? log?.status === "completed" || log?.status === "partial"
        : key >= habit.start_date && log?.status !== "lapse";
    days.push({ label, on: Boolean(on) });
  }
  return days;
}

function ctaCopy(behavior: HabitBehaviorType, todayActive: boolean): string {
  if (behavior === "build") {
    return todayActive ? "Undo today" : "✓ Mark as done";
  }
  return todayActive ? "✓ Clear slip" : "Log lapse today";
}

function useToggleToday(habit: HabitWithLogs) {
  const toggleMutation = useToggleHabitDayMutation();
  const today = todayKey();
  const [logs, setLogs] = useOptimistic(habit.logs);
  const todayActive = logs.some((l) => l.log_date === today);
  const canCheckToday = today >= habit.start_date;

  function onToggleToday() {
    if (!canCheckToday) return;

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

    toggleMutation.mutate({
      habitId: habit.id,
      behavior: habit.behavior_type,
      dateKey: today,
      wasActive: todayActive,
      habitColor: habit.color,
    });
  }

  return {
    logs,
    todayActive,
    canCheckToday,
    onToggleToday,
    isPending: toggleMutation.isPending,
  };
}

type CardContentProps = {
  habit: HabitWithLogs;
  logs: HabitLog[];
  onToggleToday?: () => void;
  interactive: boolean;
  layout: "grid" | "list";
  handleProps?: HTMLAttributes<HTMLButtonElement>;
};

function CardContent({
  habit,
  logs,
  onToggleToday,
  interactive,
  layout,
  handleProps,
}: CardContentProps) {
  const today = todayKey();
  const stats = computeStreakStats(habit.behavior_type, habit.start_date, logs, today);
  const scheduleLabel = formatScheduleLabel(habit);
  const todayActive = logs.some((l) => l.log_date === today);
  const canCheckToday = today >= habit.start_date;
  const dots = weekDots(habit, logs);
  const weekDone = dots.filter((d) => d.on).length;
  const weekPct = Math.round((weekDone / 7) * 100);
  const isQuit = habit.behavior_type === "avoid" || habit.behavior_type === "reduce";

  if (layout === "list") {
    return (
      <>
        {handleProps ? (
          <button
            type="button"
            className="drag-handle habit-card-v2-menu"
            aria-label={`Drag to reorder ${habit.name}`}
            tabIndex={interactive ? 0 : -1}
            {...handleProps}
          >
            <MoreVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        <div className="habit-card-icon-wrap">
          <HabitIcon icon={habit.icon} color={habit.color} size="md" />
        </div>
        <Link
          href={`/habits/${habit.id}`}
          className="habit-card-main"
          tabIndex={interactive ? 0 : -1}
          onClick={interactive ? undefined : (e) => e.preventDefault()}
        >
          <span className={`kind-chip habit-card-kind ${habit.behavior_type}`}>
            {behaviorLabel(habit.behavior_type)}
          </span>
          <h2>{habit.name}</h2>
          <p className="habit-meta">{scheduleLabel || `${stats.currentStreak} day streak`}</p>
        </Link>
        {canCheckToday ? (
          <button
            type="button"
            className={cn(
              "check-btn habit-card-cta",
              isQuit && "avoid",
              todayActive && "on",
            )}
            onClick={onToggleToday}
            aria-pressed={todayActive}
            disabled={!interactive || !onToggleToday}
          >
            {ctaCopy(habit.behavior_type, todayActive)}
          </button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="habit-card-v2-head">
        <HabitIcon icon={habit.icon} color={habit.color} size="lg" className="habit-card-v2-icon" />
        <div className="habit-card-v2-head-meta">
          <p className="habit-card-streak">
            <Flame className="size-3.5" aria-hidden />
            <span>{stats.currentStreak} day streak</span>
          </p>
          <div className="habit-card-v2-head-actions">
            <Link
              href={`/habits/${habit.id}`}
              className="habit-card-v2-icon-btn"
              aria-label={`Open ${habit.name}`}
              tabIndex={interactive ? 0 : -1}
              onClick={interactive ? undefined : (e) => e.preventDefault()}
            >
              <MoreVertical className="size-4" aria-hidden />
            </Link>
            {handleProps ? (
              <button
                type="button"
                className="habit-card-v2-icon-btn drag-handle"
                aria-label={`Drag to reorder ${habit.name}`}
                tabIndex={interactive ? 0 : -1}
                {...handleProps}
              >
                <span className="habit-card-drag-grip" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <span className={`kind-chip habit-card-kind ${habit.behavior_type}`}>
        {behaviorLabel(habit.behavior_type)}
      </span>

      <Link
        href={`/habits/${habit.id}`}
        className="habit-card-main habit-card-v2-title-link"
        tabIndex={interactive ? 0 : -1}
        onClick={interactive ? undefined : (e) => e.preventDefault()}
      >
        <h2>{habit.name}</h2>
        <p className="habit-meta">{scheduleLabel || "Every day"}</p>
      </Link>

      <div className="habit-week-track" aria-hidden>
        {dots.map((d, i) => (
          <span key={`${d.label}-${i}`} className={cn("habit-week-day", d.on && "on")}>
            <span className="habit-week-day-label">{d.label}</span>
            <span className="habit-week-day-dot">
              {d.on ? <Check className="size-2.5" strokeWidth={3} aria-hidden /> : null}
            </span>
          </span>
        ))}
      </div>

      <div className="habit-week-progress">
        <span className="habit-week-progress-label">
          {weekDone}/7 this week
        </span>
        <div className="habit-week-bar" role="presentation">
          <span style={{ width: `${weekPct}%` }} />
        </div>
      </div>

      {canCheckToday ? (
        <button
          type="button"
          className={cn(
            "check-btn habit-card-cta",
            isQuit && "avoid",
            todayActive && "on",
          )}
          onClick={onToggleToday}
          aria-pressed={todayActive}
          disabled={!interactive || !onToggleToday}
        >
          {ctaCopy(habit.behavior_type, todayActive)}
        </button>
      ) : null}
    </>
  );
}

function PlainHabitCard({
  habit,
  index = 0,
  overlay = false,
  layout = "grid",
}: {
  habit: HabitWithLogs;
  index?: number;
  overlay?: boolean;
  layout?: "grid" | "list";
}) {
  const { logs, onToggleToday } = useToggleToday(habit);

  return (
    <AnimatedHabitCard index={index} skipEnter={overlay} className="contents">
      <article
        className={cn(
          "habit-card habit-card-glass habit-card-v2",
          layout === "list" && "habit-card-row",
        )}
        style={{ ["--habit" as string]: habit.color }}
      >
        <HabitCardCornerArt src={resolveHabitCardArtSrc(habit)} />
        <CardContent
          habit={habit}
          logs={overlay ? habit.logs : logs}
          onToggleToday={overlay ? undefined : onToggleToday}
          interactive={!overlay}
          layout={layout}
        />
      </article>
    </AnimatedHabitCard>
  );
}

function SortableHabitCard({
  habit,
  index = 0,
  layout = "grid",
}: {
  habit: HabitWithLogs;
  index?: number;
  layout?: "grid" | "list";
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
    <AnimatedHabitCard index={index} skipEnter={isDragging} className="contents">
      <article
        ref={setNodeRef}
        className={cn(
          "habit-card habit-card-glass habit-card-v2",
          layout === "list" && "habit-card-row",
          isDragging && "dragging",
        )}
        style={{
          ["--habit" as string]: habit.color,
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0 : undefined,
        }}
      >
        <HabitCardCornerArt src={resolveHabitCardArtSrc(habit)} />
        <CardContent
          habit={habit}
          logs={logs}
          onToggleToday={onToggleToday}
          interactive
          layout={layout}
          handleProps={{ ...attributes, ...listeners }}
        />
      </article>
    </AnimatedHabitCard>
  );
}

export function HabitCard({
  habit,
  index = 0,
  overlay = false,
  sortable = true,
  layout = "grid",
}: HabitCardProps) {
  if (overlay || !sortable) {
    return (
      <PlainHabitCard habit={habit} index={index} overlay={overlay} layout={layout} />
    );
  }

  return <SortableHabitCard habit={habit} index={index} layout={layout} />;
}
