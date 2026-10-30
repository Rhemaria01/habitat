"use client";

import { useOptimistic, useState, type MouseEvent } from "react";
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
import { Spinner } from "@/components/ui/spinner";

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

type PendingAction = HabitLogStatus | "clear" | null;

function BackfillButton({
  pending,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  pending: boolean;
}) {
  return (
    <Button {...props} aria-busy={pending}>
      {pending ? <Spinner className="size-3.5" aria-hidden /> : children}
    </Button>
  );
}

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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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
    const action: PendingAction = status === null ? "clear" : status;

    setPendingAction(action);
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
      {
        onSettled: () => setPendingAction(null),
        onSuccess: () => onUpdated?.(),
      },
    );
  }

  function actionVariant(status: HabitLogStatus): "default" | "outline" {
    return optimisticLog?.status === status ? "default" : "outline";
  }

  const busy = setLogMutation.isPending;

  return (
    <div className="cal-backfill">
      <p className="cal-backfill-label">Backfill this day</p>
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
            <BackfillButton
              type="button"
              size="sm"
              variant={actionVariant("completed")}
              disabled={busy}
              pending={pendingAction === "completed"}
              onClick={(e) => apply("completed", e)}
            >
              ✓ Done
            </BackfillButton>
            <BackfillButton
              type="button"
              size="sm"
              variant={actionVariant("partial")}
              disabled={busy}
              pending={pendingAction === "partial"}
              onClick={(e) => apply("partial", e)}
            >
              Partial
            </BackfillButton>
            <BackfillButton
              type="button"
              size="sm"
              variant={actionVariant("missed")}
              disabled={busy}
              pending={pendingAction === "missed"}
              onClick={(e) => apply("missed", e)}
            >
              ✗ Missed
            </BackfillButton>
          </>
        ) : (
          <>
            <BackfillButton
              type="button"
              size="sm"
              variant={actionVariant("maintained")}
              disabled={busy}
              pending={pendingAction === "maintained"}
              onClick={(e) => apply("maintained", e)}
            >
              Maintained
            </BackfillButton>
            <BackfillButton
              type="button"
              size="sm"
              variant={actionVariant("lapse")}
              disabled={busy}
              pending={pendingAction === "lapse"}
              onClick={(e) => apply("lapse", e)}
            >
              Lapse
            </BackfillButton>
          </>
        )}
        <BackfillButton
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy || !optimisticLog}
          pending={pendingAction === "clear"}
          className={cn(!optimisticLog && "cal-backfill-clear-idle")}
          aria-hidden={!optimisticLog}
          tabIndex={optimisticLog ? 0 : -1}
          onClick={(e) => apply(null, e)}
        >
          Clear
        </BackfillButton>
      </div>
    </div>
  );
}
