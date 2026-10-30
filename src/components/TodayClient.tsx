"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  MoreVertical,
  Plus,
} from "lucide-react";
import type { TodayDashboard } from "@/app/actions/today";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { QueryLoadingOverlay } from "@/components/api/QueryLoading";
import { useSetHabitLogMutation } from "@/hooks/api/use-mutations";
import { outcomeFromLogStatus } from "@/lib/calendar-optimistic";
import { useTodayQuery } from "@/hooks/api/use-today";
import { AnimatedBar } from "@/components/animated/AnimatedBar";
import { AnimatedCheck } from "@/components/animated/AnimatedCheck";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { AnimatedPage } from "@/components/animated/AnimatedPage";
import { AnimatedProgressRing } from "@/components/animated/AnimatedProgress";
import { HabitIcon } from "@/components/HabitIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addDays, LOCALE, parseDateKey, todayKey } from "@/lib/dates";
import {
  formatHabitSubtitle,
  formatHabitTimeRail,
  numericProgress,
  sortTodayHabits,
  streakValueLabel,
} from "@/lib/today-display";
import type { HabitLog, TodayHabitItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type TodayClientProps = {
  dateKey: string;
  items: TodayHabitItem[];
  weekAdherence: number | null;
  recoveryHint: string | null;
  dashboard: TodayDashboard;
};

function isLoggedOk(log: HabitLog | null): boolean {
  return Boolean(
    log &&
      log.status !== "missed" &&
      log.status !== "lapse" &&
      log.status !== "skipped",
  );
}

function TodayDateNav({ dateKey }: { dateKey: string }) {
  const router = useRouter();
  const today = todayKey();
  const d = parseDateKey(dateKey);
  const weekday = d.toLocaleDateString(LOCALE, { weekday: "long" });
  const rest = d.toLocaleDateString(LOCALE, { day: "numeric", month: "long" });
  const prettyDate = `${weekday}, ${rest}`;

  function navigate(key: string) {
    if (key === today) router.push("/");
    else router.push(`/?date=${key}`);
  }

  return (
    <div className="today-date-nav-wrap">
      <p className="today-date-nav-caption">{prettyDate}</p>
      <div className="today-date-nav">
        <button
          type="button"
          className="today-date-nav-btn"
          aria-label="Previous day"
          onClick={() => navigate(addDays(dateKey, -1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={cn("today-date-today-btn", dateKey === today && "on")}
          disabled={dateKey === today}
          onClick={() => navigate(today)}
        >
          Today
        </button>
        <button
          type="button"
          className="today-date-nav-btn"
          aria-label="Next day"
          disabled={dateKey >= today}
          onClick={() => navigate(addDays(dateKey, 1))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function TodayHabitRow({
  dateKey,
  habit,
  log,
}: {
  dateKey: string;
  habit: TodayHabitItem["habit"];
  log: HabitLog | null;
}) {
  const setLogMutation = useSetHabitLogMutation();
  const [optimisticLog, setOptimisticLog] = useOptimistic(log);
  const done = isLoggedOk(optimisticLog);
  const behavior = habit.behavior_type;
  const subtitle = formatHabitSubtitle(habit);
  const timeRail = formatHabitTimeRail(habit);
  const numeric = numericProgress(habit, optimisticLog);

  function toggle() {
    const nextStatus =
      behavior === "build"
        ? done
          ? null
          : "completed"
        : done
          ? null
          : "maintained";
    setOptimisticLog(
      nextStatus
        ? {
            id: optimisticLog?.id ?? "opt",
            habit_id: habit.id,
            log_date: dateKey,
            status: nextStatus as HabitLog["status"],
            note: null,
            numeric_value: optimisticLog?.numeric_value ?? null,
            completion_level: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : null,
    );
    setLogMutation.mutate({
      habitId: habit.id,
      dateKey,
      status: nextStatus,
      behavior: habit.behavior_type,
      habitColor: habit.color,
      prevOutcome: outcomeFromLogStatus(
        habit.behavior_type,
        optimisticLog?.status ?? null,
      ),
    });
  }

  return (
    <li
      className={cn("today-habit-row", done && "done")}
      style={{ ["--habit" as string]: habit.color }}
    >
      <AnimatedCheck
        checked={done}
        onToggle={toggle}
        label={done ? `Undo ${habit.name}` : `Complete ${habit.name}`}
      />
      <HabitIcon icon={habit.icon} color={habit.color} size="sm" />
      <div className="today-habit-body">
        <Link href={`/habits/${habit.id}`} className="today-habit-title">
          {habit.name}
        </Link>
        {subtitle ? <p className="today-habit-meta">{subtitle}</p> : null}
      </div>
      <div className="today-habit-rail">
        {done ? (
          <span className="today-habit-status on">Completed</span>
        ) : numeric ? (
          <div className="today-habit-numeric">
            <div className="today-habit-numeric-bar" aria-hidden>
              <span style={{ width: `${numeric.percent}%` }} />
            </div>
            <span className="today-habit-numeric-label">{numeric.label}</span>
          </div>
        ) : timeRail ? (
          <span className="today-habit-time">{timeRail}</span>
        ) : (
          <span className="today-habit-status">Pending</span>
        )}
      </div>
      <Link
        href={`/habits/${habit.id}`}
        className="today-habit-menu"
        aria-label={`Open ${habit.name}`}
      >
        <MoreVertical className="size-4" aria-hidden />
      </Link>
    </li>
  );
}

export function TodayClient({
  dateKey,
  items: initialItems,
  weekAdherence: _weekAdherence,
  recoveryHint: initialRecoveryHint,
  dashboard: initialDashboard,
}: TodayClientProps) {
  const [addOpen, setAddOpen] = useState(false);

  const {
    data,
    isFetching,
    isLoading,
    recoveryHint,
  } = useTodayQuery(dateKey, {
    initialData: {
      items: initialItems,
      weekAdherence: _weekAdherence,
      dashboard: initialDashboard,
    },
    initialRecoveryHint: initialRecoveryHint,
  });

  const items = data?.items ?? initialItems;
  const dashboard = data?.dashboard ?? initialDashboard;
  const hint = recoveryHint ?? initialRecoveryHint;

  const scheduled = sortTodayHabits(items.filter((i) => i.scheduled));
  const doneCount = scheduled.filter((i) => isLoggedOk(i.log)).length;
  const progressPct =
    scheduled.length === 0
      ? 0
      : Math.round((doneCount / scheduled.length) * 100);

  const ringValue = scheduled.length === 0 ? null : progressPct;

  return (
    <AnimatedPage className="today-page relative">
      <QueryLoadingOverlay
        show={isFetching && !isLoading}
        label="Updating today…"
      />
      <header className="today-hero">
        <div className="today-hero-copy">
          <h1>{dashboard.greeting}</h1>
          <p className="today-tagline">Let&apos;s make today count ✨</p>
        </div>
        <TodayDateNav dateKey={dateKey} />
      </header>

      <ul className="dash-stat-grid">
        <li className="dash-stat dash-stat-row glass-panel">
          <AnimatedProgressRing value={ringValue} />
          <div className="dash-stat-copy">
            <p className="dash-stat-label">Today&apos;s progress</p>
            <p className="dash-stat-detail">
              {scheduled.length
                ? `${doneCount} of ${scheduled.length} habits`
                : "No habits scheduled"}
            </p>
          </div>
        </li>
        <li className="dash-stat dash-stat-row glass-panel">
          <Flame className="dash-stat-icon text-chart-2" aria-hidden />
          <div className="dash-stat-copy">
            <p className="dash-stat-value">{streakValueLabel(dashboard.currentStreak)}</p>
            <p className="dash-stat-label">Current streak</p>
          </div>
        </li>
        <li className="dash-stat dash-stat-row glass-panel">
          <Crown className="dash-stat-icon text-chart-4" aria-hidden />
          <div className="dash-stat-copy">
            <p className="dash-stat-value">{streakValueLabel(dashboard.bestStreak)}</p>
            <p className="dash-stat-label">Best streak</p>
          </div>
        </li>
        <li className="dash-stat dash-stat-row glass-panel">
          <BarChart3 className="dash-stat-icon text-chart-5" aria-hidden />
          <div className="dash-stat-copy">
            <p className="dash-stat-value">
              <AnimatedCounter value={dashboard.monthLogCount} decimals={0} />
            </p>
            <p className="dash-stat-label">Logs this month</p>
          </div>
        </li>
      </ul>

      {hint ? (
        <div className="glass-panel remember-line">{hint}</div>
      ) : null}

      <section className="glass-panel today-list-panel">
        <div className="today-panel-head">
          <div className="today-panel-title-block">
            <div className="today-panel-title-row">
              <h2>Today&apos;s habits</h2>
              <div className="today-panel-actions">
                <button
                  type="button"
                  className="add-habit-btn"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  Add habit
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="today-panel-menu"
                      aria-label="List options"
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/habits">Manage habits</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/calendar">Open calendar</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {scheduled.length > 0 ? (
              <p className="today-section-meta">
                {doneCount} / {scheduled.length} completed
              </p>
            ) : null}
          </div>
          {scheduled.length > 0 ? (
            <AnimatedBar percent={progressPct} />
          ) : null}
        </div>

        {scheduled.length === 0 ? (
          <p className="grid-hint">
            Nothing scheduled today.{" "}
            <button type="button" className="underline" onClick={() => setAddOpen(true)}>
              Add a habit
            </button>
            .
          </p>
        ) : (
          <ul className="today-habit-list">
            {scheduled.map(({ habit, log }) => (
              <TodayHabitRow key={habit.id} dateKey={dateKey} habit={habit} log={log} />
            ))}
          </ul>
        )}
      </section>

      <AddHabitDialog open={addOpen} onOpenChange={setAddOpen} />
    </AnimatedPage>
  );
}
