"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleHabitDay } from "@/app/actions/habits";
import { todayKey } from "@/lib/dates";
import type { HabitKind, HabitLog } from "@/lib/types";
import { BorderBeamButton } from "@/components/ui/border-beam-button";

type CheckInButtonProps = {
  habitId: string;
  kind: HabitKind;
  startDate: string;
  logs: HabitLog[];
};

export function CheckInButton({
  habitId,
  kind,
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
            status: kind === "build" ? "done" : "relapse",
            created_at: new Date().toISOString(),
          },
        ];
      });

      const result = await toggleHabitDay(habitId, kind, today, active);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <BorderBeamButton
      type="button"
      colorVariant="mono"
      className={`check-btn large ${active ? "on" : ""} ${kind} animate-pop`}
      onClick={onClick}
      aria-pressed={active}
    >
      {kind === "build"
        ? active
          ? "Undo today’s check-in"
          : "I did it today"
        : active
          ? "Clear today’s slip"
          : "I slipped today"}
    </BorderBeamButton>
  );
}
