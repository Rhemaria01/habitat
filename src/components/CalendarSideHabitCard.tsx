"use client";

import Link from "next/link";
import { useOptimistic, useState, type MouseEvent } from "react";
import { HabitCardActionsMenu } from "@/components/HabitCardActionsMenu";
import { useCalendarFly } from "@/components/calendar/CalendarFlyProvider";
import { HabitIcon } from "@/components/HabitIcon";
import { useSetHabitLogMutation } from "@/hooks/api/use-mutations";
import type { CalendarDayHabitRow } from "@/app/actions/calendar";
import {
  buildOptimisticLog,
  isCelebrationStatus,
  outcomeFromLogStatus,
} from "@/lib/calendar-optimistic";
import { canBackfillHabitDay } from "@/lib/calendar-day";
import type { HabitLogStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type CalendarSideHabitCardProps = {
  habit: CalendarDayHabitRow;
  dateKey: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

type PendingAction = HabitLogStatus | "clear" | null;

function statusLabel(
  behavior: CalendarDayHabitRow["behavior_type"],
  status: HabitLogStatus,
): string {
  if (behavior === "build") {
    if (status === "completed") return "Done";
    if (status === "partial") return "Partial";
    if (status === "missed") return "Missed";
    return status;
  }
  if (status === "maintained") return "Kept";
  if (status === "lapse") return "Lapse";
  return status;
}

export function CalendarSideHabitCard({
  habit,
  dateKey,
  onEdit,
  onDelete,
}: CalendarSideHabitCardProps) {
  const setLogMutation = useSetHabitLogMutation();
  const fly = useCalendarFly();
  const [optimisticLog, setOptimisticLog] = useOptimistic(habit.log);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const canLog = canBackfillHabitDay({ start_date: habit.start_date }, dateKey);
  const showLogBar = habit.scheduled && canLog;
  const busy = setLogMutation.isPending;

  function apply(status: HabitLogStatus | null, event: MouseEvent<HTMLButtonElement>) {
    const prevOutcome = outcomeFromLogStatus(
      habit.behavior_type,
      optimisticLog?.status ?? null,
    );
    const action: PendingAction = status === null ? "clear" : status;

    setPendingAction(action);
    setOptimisticLog(buildOptimisticLog(habit.id, dateKey, status));

    if (fly && isCelebrationStatus(habit.behavior_type, status)) {
      fly.flyCompleteToDate({
        from: event.currentTarget,
        dateKey,
        color: habit.color,
      });
    }

    setLogMutation.mutate(
      {
        habitId: habit.id,
        dateKey,
        status,
        behavior: habit.behavior_type,
        habitColor: habit.color,
        prevOutcome,
      },
      { onSettled: () => setPendingAction(null) },
    );
  }

  const buildOptions: HabitLogStatus[] = ["completed", "partial", "missed"];
  const quitOptions: HabitLogStatus[] = ["maintained", "lapse"];
  const options = habit.behavior_type === "build" ? buildOptions : quitOptions;

  return (
    <article
      className="cal-side-habit-card"
      style={{ ["--habit" as string]: habit.color }}
    >
      <div className="cal-side-habit-card-head">
        <HabitIcon icon={habit.icon} color={habit.color} size="sm" />
        <div className="cal-side-habit-card-copy">
          <Link href={`/habits/${habit.id}`} className="cal-side-habit-card-name">
            {habit.name}
          </Link>
          <span className="cal-side-habit-card-meta">{habit.timeLabel || "Anytime"}</span>
        </div>
        <HabitCardActionsMenu
          habitName={habit.name}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {!canLog ? (
        <p className="cal-side-habit-card-hint">Before start date — not tracked yet.</p>
      ) : !habit.scheduled ? (
        <p className="cal-side-habit-card-hint">Not scheduled on this day.</p>
      ) : (
        <div className="cal-log-bar" role="group" aria-label={`Log ${habit.name} for this day`}>
          <div className="cal-log-segment">
            {options.map((status) => {
              const active = optimisticLog?.status === status;
              const pending = pendingAction === status;
              return (
                <button
                  key={status}
                  type="button"
                  className={cn("cal-log-chip", active && "on")}
                  disabled={busy}
                  aria-pressed={active}
                  onClick={(e) => apply(active ? null : status, e)}
                >
                  {pending ? (
                    <Spinner className="size-3" aria-hidden />
                  ) : (
                    statusLabel(habit.behavior_type, status)
                  )}
                </button>
              );
            })}
          </div>
          {optimisticLog ? (
            <button
              type="button"
              className="cal-log-clear"
              disabled={busy}
              onClick={(e) => apply(null, e)}
            >
              {pendingAction === "clear" ? (
                <Spinner className="size-3" aria-hidden />
              ) : (
                "Clear"
              )}
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}
