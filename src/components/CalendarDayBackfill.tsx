"use client";

import { Loader2 } from "lucide-react";
import { useOptimistic, type MouseEvent } from "react";
import { useCalendarFly } from "@/components/calendar/CalendarFlyProvider";
import { useSetHabitLogMutation } from "@/hooks/api/use-mutations";
import {
  buildOptimisticLog,
  isCelebrationStatus,
  outcomeFromLogStatus,
} from "@/lib/calendar-optimistic";
import { canBackfillHabitDay } from "@/lib/calendar-day";
import type { HabitBehaviorType, HabitLog, HabitLogStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CalendarDayBackfillProps = {
  habitId: string;
  behavior: HabitBehaviorType;
  startDate: string;
  dateKey: string;
  habitColor: string;
  log: HabitLog | null;
  scheduled: boolean;
  onUpdated?: () => void;
};

export function CalendarDayBackfill({
  habitId,
  behavior,
  startDate,
  dateKey,
  habitColor,
  log,
  scheduled,
  onUpdated,
}: CalendarDayBackfillProps) {
  const setLogMutation = useSetHabitLogMutation();
  const fly = useCalendarFly();
  const [optimisticLog, setOptimisticLog] = useOptimistic(log);

  if (!canBackfillHabitDay({ start_date: startDate }, dateKey)) {
    return (
      <p className="cal-backfill-hint text-xs text-muted-foreground">
        Before start date — no tracking yet (—).
      </p>
    );
  }

  if (!scheduled) {
    return (
      <p className="cal-backfill-hint text-xs text-muted-foreground">
        Not scheduled on this day.
      </p>
    );
  }

  function apply(status: HabitLogStatus | null, event: MouseEvent<HTMLButtonElement>) {
    const prevOutcome = outcomeFromLogStatus(behavior, optimisticLog?.status ?? null);

    setOptimisticLog(buildOptimisticLog(habitId, dateKey, status));

    if (fly && isCelebrationStatus(behavior, status)) {
      fly.flyCompleteToDate({
        from: event.currentTarget,
        dateKey,
        color: habitColor,
      });
    }

    setLogMutation.mutate(
      {
        habitId,
        dateKey,
        status,
        behavior,
        habitColor,
        prevOutcome,
      },
      { onSuccess: () => onUpdated?.() },
    );
  }

  function actionVariant(status: HabitLogStatus): "default" | "outline" {
    return optimisticLog?.status === status ? "default" : "outline";
  }

  return (
    <div className="cal-backfill">
      <p className="cal-backfill-label">
        Backfill this day
        <span className="cal-backfill-pending" aria-live="polite">
          {setLogMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
        </span>
      </p>
      <div
        className={cn(
          "cal-backfill-actions",
          behavior === "build"
            ? "cal-backfill-actions--build"
            : "cal-backfill-actions--quit",
        )}
      >
        {behavior === "build" ? (
          <>
            <Button
              type="button"
              size="sm"
              variant={actionVariant("completed")}
              disabled={setLogMutation.isPending}
              onClick={(e) => apply("completed", e)}
            >
              ✓ Done
            </Button>
            <Button
              type="button"
              size="sm"
              variant={actionVariant("partial")}
              disabled={setLogMutation.isPending}
              onClick={(e) => apply("partial", e)}
            >
              Partial
            </Button>
            <Button
              type="button"
              size="sm"
              variant={actionVariant("missed")}
              disabled={setLogMutation.isPending}
              onClick={(e) => apply("missed", e)}
            >
              ✗ Missed
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant={actionVariant("maintained")}
              disabled={setLogMutation.isPending}
              onClick={(e) => apply("maintained", e)}
            >
              Maintained
            </Button>
            <Button
              type="button"
              size="sm"
              variant={actionVariant("lapse")}
              disabled={setLogMutation.isPending}
              onClick={(e) => apply("lapse", e)}
            >
              Lapse
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={setLogMutation.isPending || !optimisticLog}
          className={cn(!optimisticLog && "cal-backfill-clear-idle")}
          aria-hidden={!optimisticLog}
          tabIndex={optimisticLog ? 0 : -1}
          onClick={(e) => apply(null, e)}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
