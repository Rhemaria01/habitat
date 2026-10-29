"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleHabitDay } from "@/app/actions/habits";
import { todayKey } from "@/lib/dates";
import type { HabitBehaviorType, HabitLog } from "@/lib/types";
import { Button } from "@/components/ui/button";

type CheckInButtonProps = {
  habitId: string;
  behavior: HabitBehaviorType;
  startDate: string;
  logs: HabitLog[];
};

export function CheckInButton({
  habitId,
  behavior,
  startDate,
  logs,
}: CheckInButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const today = todayKey();
  const [optimisticLogs, setLogs] = useOptimistic(logs);
  const active = optimisticLogs.some((l) => l.log_date === today);
  const canCheck = today >= startDate;

  if (!canCheck) return null;

  function onClick() {
    startTransition(async () => {
      setLogs((current) => {
        if (active) return current.filter((l) => l.log_date !== today);
        return [
          ...current.filter((l) => l.log_date !== today),
          {
            id: `optimistic-${today}`,
            habit_id: habitId,
            log_date: today,
            status: behavior === "build" ? "completed" : "maintained",
            note: null,
            numeric_value: null,
            completion_level: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });

      const result = await toggleHabitDay(habitId, behavior, today, active);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "default"}
      className={`check-btn large ${active ? "on" : ""} ${behavior}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {behavior === "build"
        ? active
          ? "Undo today’s check-in"
          : "I did it today"
        : active
          ? "Clear today’s slip"
          : "Log lapse today"}
    </Button>
  );
}
