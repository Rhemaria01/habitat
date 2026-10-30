"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { flyHabitCompleteToCell } from "@/animations/habit-complete-fly";
import { pulseCalendarDay } from "@/animations/calendar-animations";
import { emitHabitCompleted } from "@/animations/habit-events";

type FlyCompleteInput = {
  from: HTMLElement;
  dateKey: string;
  color: string;
};

type CalendarFlyContextValue = {
  registerCalendarCell: (dateKey: string, el: HTMLElement | null) => void;
  flyCompleteToDate: (input: FlyCompleteInput) => void;
};

const CalendarFlyContext = createContext<CalendarFlyContextValue | null>(null);

export function CalendarFlyProvider({ children }: { children: ReactNode }) {
  const cellsRef = useRef(new Map<string, HTMLElement>());

  const registerCalendarCell = useCallback(
    (dateKey: string, el: HTMLElement | null) => {
      if (el) cellsRef.current.set(dateKey, el);
      else cellsRef.current.delete(dateKey);
    },
    [],
  );

  const flyCompleteToDate = useCallback(
    ({ from, dateKey, color }: FlyCompleteInput) => {
      const target = cellsRef.current.get(dateKey);
      if (!target) {
        emitHabitCompleted();
        return;
      }

      void flyHabitCompleteToCell(from, target, color).then(() => {
        pulseCalendarDay(target);
        target.classList.add("cal-v2-day--celebrate");
        window.setTimeout(() => {
          target.classList.remove("cal-v2-day--celebrate");
        }, 520);
        emitHabitCompleted();
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ registerCalendarCell, flyCompleteToDate }),
    [registerCalendarCell, flyCompleteToDate],
  );

  return (
    <CalendarFlyContext.Provider value={value}>{children}</CalendarFlyContext.Provider>
  );
}

export function useCalendarFly(): CalendarFlyContextValue | null {
  return useContext(CalendarFlyContext);
}

/** Attach to month-grid day buttons so fly animations can resolve targets. */
export function useCalendarCellRef(dateKey: string | null | undefined) {
  const fly = useCalendarFly();
  return useCallback(
    (el: HTMLElement | null) => {
      if (!fly || !dateKey) return;
      fly.registerCalendarCell(dateKey, el);
    },
    [fly, dateKey],
  );
}
