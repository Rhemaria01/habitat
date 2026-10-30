"use client";

import { useOptimistic, type MouseEvent } from "react";
import { useCalendarFly } from "@/components/calendar/CalendarFlyProvider";
import { useToggleHabitDayMutation } from "@/hooks/api/use-mutations";
import { todayKey } from "@/lib/dates";
import type { HabitBehaviorType, HabitLog } from "@/lib/types";
import { Button } from "@/components/ui/button";

type CheckInButtonProps = {
  habitId: string;
  behavior: HabitBehaviorType;
  startDate: string;
  logs: HabitLog[];
  color: string;
  /** When true, plays fly-to-calendar animation on check-in (habit detail page). */
  flyToCalendar?: boolean;
};

export function CheckInButton({
  habitId,
  behavior,
  startDate,
  logs,
  color,
  flyToCalendar = false,
}: CheckInButtonProps) {
  const toggleMutation = useToggleHabitDayMutation();
  const fly = useCalendarFly();
  const today = todayKey();
  const [optimisticLogs, setLogs] = useOptimistic(logs);
  const active = optimisticLogs.some((l) => l.log_date === today);
  const canCheck = today >= startDate;

  if (!canCheck) return null;

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    const wasActive = active;

    setLogs((current) => {
      if (wasActive) return current.filter((l) => l.log_date !== today);
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

    if (flyToCalendar && fly && !wasActive) {
      fly.flyCompleteToDate({
        from: event.currentTarget,
        dateKey: today,
        color,
      });
    }

    toggleMutation.mutate({
      habitId,
      behavior,
      dateKey: today,
      wasActive,
      habitColor: color,
    });
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "default"}
      className={`check-btn large ${active ? "on" : ""} ${behavior}`}
      onClick={onClick}
      aria-pressed={active}
      disabled={toggleMutation.isPending}
    >
      {behavior === "build"
        ? active
          ? "Undo today’s check-in"
          : "✓ I did it today"
        : active
          ? "Clear today’s slip"
          : "Log lapse today"}
    </Button>
  );
}
