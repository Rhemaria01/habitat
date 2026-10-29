"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setHabitLog } from "@/app/actions/today";
import type { HabitBehaviorType, HabitLog, HabitLogStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HabitLogControlProps = {
  habitId: string;
  behavior: HabitBehaviorType;
  logDate: string;
  log: HabitLog | null;
  scheduled: boolean;
};

function defaultCompleteStatus(behavior: HabitBehaviorType): HabitLogStatus {
  return behavior === "build" ? "completed" : "maintained";
}

export function HabitLogControl({
  habitId,
  behavior,
  logDate,
  log,
  scheduled,
}: HabitLogControlProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticLog, setOptimisticLog] = useOptimistic(log);

  if (!scheduled) {
    return <span className="text-xs text-muted-foreground">Not scheduled</span>;
  }

  function apply(status: HabitLogStatus | null) {
    startTransition(async () => {
      setOptimisticLog(
        status
          ? {
              id: optimisticLog?.id ?? "opt",
              habit_id: habitId,
              log_date: logDate,
              status,
              note: null,
              numeric_value: null,
              completion_level: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null,
      );
      const result = await setHabitLog(habitId, logDate, status);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  const label = optimisticLog?.status ?? "pending";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={optimisticLog ? "secondary" : "default"}
        onClick={() =>
          apply(
            optimisticLog
              ? null
              : defaultCompleteStatus(behavior),
          )
        }
      >
        {optimisticLog
          ? "Clear"
          : behavior === "build"
            ? "Done"
            : "Maintained"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {behavior === "build" ? (
            <>
              <DropdownMenuItem onClick={() => apply("completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => apply("partial")}>
                Partial / minimum
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => apply("missed")}>
                Missed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => apply("skipped")}>
                Skipped (not a miss)
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => apply("maintained")}>
                Maintained
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => apply("lapse")}>
                Log lapse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => apply("skipped")}>
                Skipped
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => apply(null)}>Clear log</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
