"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  Flame,
  Pencil,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CalendarMonth } from "@/app/actions/calendar";
import { CheckInButton } from "@/components/CheckInButton";
import { HabitDetailCalendar } from "@/components/HabitDetailCalendar";
import { CalendarFlyProvider } from "@/components/calendar/CalendarFlyProvider";
import { HabitForm } from "@/components/HabitForm";
import { HabitIcon } from "@/components/HabitIcon";
import { useDeleteHabitMutation } from "@/hooks/api/use-mutations";
import {
  buildHabitOverview,
  buildHabitWeekDays,
  buildRecentActivity,
  habitDetailTagline,
} from "@/lib/habit-detail-display";
import { formatScheduleLabel } from "@/lib/domain/schedule";
import { computeStreakStats } from "@/lib/streaks";
import type { HabitWithLogs } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RollingNumber } from "@/components/ui/rolling-number";

type HabitDetailClientProps = {
  habit: HabitWithLogs;
  initialCalendar: CalendarMonth;
};

function ActivityIcon({ outcome }: { outcome: string }) {
  if (outcome === "completed") {
    return (
      <span className="hd-activity-icon completed" aria-hidden>
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (outcome === "partial") {
    return (
      <span className="hd-activity-icon partial" aria-hidden>
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (outcome === "missed") {
    return (
      <span className="hd-activity-icon missed" aria-hidden>
        <X className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  return <span className="hd-activity-icon none" aria-hidden />;
}

export function HabitDetailClient({ habit, initialCalendar }: HabitDetailClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const deleteMutation = useDeleteHabitMutation(habit.id);
  const [error, setError] = useState<string | null>(null);

  const stats = computeStreakStats(habit.behavior_type, habit.start_date, habit.logs);
  const scheduleLabel = formatScheduleLabel(habit);
  const tagline = habitDetailTagline(habit);
  const overview = useMemo(() => buildHabitOverview(habit), [habit]);
  const weekDays = useMemo(() => buildHabitWeekDays(habit), [habit]);
  const activity = useMemo(() => buildRecentActivity(habit), [habit]);
  const monthPct = overview.monthPercent ?? 0;

  function onDelete() {
    setError(null);
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(`“${habit.name}” deleted.`);
        router.push("/habits");
      },
      onError: (err) => setError(err.userMessage),
    });
  }

  return (
    <CalendarFlyProvider>
    <div
      className="habit-detail-page habit-detail-v2"
      style={{ ["--habit" as string]: habit.color }}
    >
      <header className="habit-detail-nav">
        <Link href="/habits" className="habit-detail-back">
          <ArrowLeft className="size-4" aria-hidden />
          Habits
        </Link>
        <div className="habit-detail-nav-actions">
          <Button
            type="button"
            variant={editing ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil className="size-3.5" aria-hidden />
            {editing ? "Done" : "Edit"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" disabled={deleteMutation.isPending}>
                <Trash2 className="size-3.5" aria-hidden />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{habit.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the habit and all check-in history. It can&apos;t be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="habit-detail-v2-layout">
        <div className="habit-detail-v2-left">
          <section className="habit-detail-hero glass-panel">
            <div className="habit-detail-hero-top">
              <div className="habit-detail-hero-icon">
                <HabitIcon icon={habit.icon} color={habit.color} size="lg" />
              </div>
              <div className="habit-detail-hero-copy">
                <div className="detail-hero-chips">
                  <span className={`kind-chip ${habit.behavior_type}`}>
                    {habit.behavior_type}
                  </span>
                  {scheduleLabel ? (
                    <span className="freq-chip">{scheduleLabel}</span>
                  ) : null}
                </div>
                <h1>{habit.name}</h1>
                <p className="habit-detail-tagline">{tagline}</p>
              </div>
            </div>

            <div className="habit-detail-stat-row">
              <div className="habit-stat-pill">
                <Flame className="size-4 text-[var(--chart-2)]" aria-hidden />
                <strong>
                  <RollingNumber value={stats.currentStreak} format={(n) => `${n}`} />
                </strong>
                <span>Current streak</span>
              </div>
              <div className="habit-stat-pill">
                <Trophy className="size-4 text-[var(--chart-2)]" aria-hidden />
                <strong>
                  <RollingNumber value={stats.bestStreak} format={(n) => `${n}`} />
                </strong>
                <span>Best streak</span>
              </div>
            </div>

            <CheckInButton
              habitId={habit.id}
              behavior={habit.behavior_type}
              startDate={habit.start_date}
              logs={habit.logs}
              color={habit.color}
              flyToCalendar
            />
          </section>

          <section className="habit-detail-block glass-panel">
            <h2 className="habit-detail-block-title">Overview</h2>
            <div className="habit-detail-overview-grid">
              <div className="hd-overview-ring">
                <div
                  className="hd-overview-ring-chart"
                  style={{
                    background: `conic-gradient(var(--chart-1) 0 ${monthPct}%, color-mix(in srgb, var(--foreground) 12%, transparent) ${monthPct}% 100%)`,
                  }}
                >
                  <div className="hd-overview-ring-inner">
                    <HabitIcon icon={habit.icon} color={habit.color} size="sm" />
                  </div>
                </div>
                <p>
                  <strong>{monthPct}%</strong>
                  <span>This month</span>
                </p>
              </div>
              <div className="hd-overview-stat">
                <Cloud className="size-4" aria-hidden />
                <p>
                  <strong>
                    {overview.monthCompleted}/{overview.monthScheduled || "—"}
                  </strong>
                  <span>Days completed</span>
                </p>
              </div>
              <div className="hd-overview-stat">
                <CalendarDays className="size-4" aria-hidden />
                <p>
                  <strong>{overview.weekPlanned}</strong>
                  <span>Planned this week</span>
                </p>
              </div>
              <div className="hd-overview-stat">
                <BarChart3 className="size-4" aria-hidden />
                <p>
                  <strong>{overview.currentStreak} day</strong>
                  <span>Current streak</span>
                </p>
              </div>
            </div>
          </section>

          <section className="habit-detail-block glass-panel">
            <div className="habit-detail-block-head">
              <h2 className="habit-detail-block-title">Weekly progress</h2>
              <span className="hd-week-chip">This week</span>
            </div>
            <div className="hd-week-pills" role="list">
              {weekDays.map((d) => (
                <div
                  key={d.key}
                  role="listitem"
                  className={`hd-week-pill ${d.outcome} ${d.scheduled ? "" : "off"}`}
                  title={d.label}
                >
                  <span className="hd-week-pill-label">{d.label}</span>
                  {d.scheduled && d.outcome === "completed" ? (
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  ) : null}
                  {d.scheduled && d.outcome === "partial" ? (
                    <span className="hd-week-pill-dot partial" aria-hidden />
                  ) : null}
                  {d.scheduled && d.outcome === "missed" ? (
                    <X className="size-3" strokeWidth={3} aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="habit-detail-block glass-panel">
            <div className="habit-detail-block-head">
              <h2 className="habit-detail-block-title">Recent activity</h2>
              <span className="hd-view-all">View all</span>
            </div>
            <ul className="hd-activity-list">
              {activity.map((row) => (
                <li key={row.dateKey}>
                  <ActivityIcon outcome={row.outcome} />
                  <div className="hd-activity-copy">
                    <span className="hd-activity-date">{row.dateLabel}</span>
                    <span className="hd-activity-meta">
                      {row.statusLabel}
                      {row.timeLabel ? ` · ${row.timeLabel}` : ""}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </li>
              ))}
            </ul>
          </section>

          {editing ? (
            <section className="habit-detail-block glass-panel">
              <h2 className="habit-detail-block-title">Edit habit</h2>
              <HabitForm habit={habit} onDone={() => setEditing(false)} compact />
            </section>
          ) : null}
        </div>

        <div className="habit-detail-v2-right">
          <HabitDetailCalendar
            habitId={habit.id}
            habit={habit}
            initial={initialCalendar}
          />
        </div>
      </div>

      {error ? <p className="form-error habit-detail-error">{error}</p> : null}
    </div>
    </CalendarFlyProvider>
  );
}
