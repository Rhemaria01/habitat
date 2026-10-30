"use client";

import { useEffect, useState } from "react";
import { habitGridColumnCount } from "@/lib/habit-card-mascot-variant";

export function useHabitGridColumnCount(enabled: boolean): number {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    if (!enabled) return;
    const sync = () => setColumns(habitGridColumnCount(window.innerWidth));
    sync();
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
  }, [enabled]);

  return columns;
}
