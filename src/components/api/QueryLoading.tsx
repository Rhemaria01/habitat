"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/types";
import type { CalendarMonth } from "@/app/actions/calendar";
import { cn } from "@/lib/utils";

type QueryErrorBannerProps = {
  error: unknown;
  className?: string;
};

export function QueryErrorBanner({ error, className }: QueryErrorBannerProps) {
  if (!error) return null;
  return (
    <p className={cn("form-error text-sm", className)} role="alert">
      {getApiErrorMessage(error)}
    </p>
  );
}

export function calendarMonthViewPending(
  month: CalendarMonth,
  year: number,
  monthIndex: number,
  fetching: boolean,
) {
  const matches = month.year === year && month.month === monthIndex;
  return fetching && !matches;
}

export function CalendarGridSkeleton() {
  return (
    <div className="cal-v2-grid cal-v2-grid-skeleton" aria-hidden>
      {Array.from({ length: 35 }, (_, i) => (
        <Skeleton key={i} className="cal-v2-day-skeleton aspect-square w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CalendarSideSkeleton() {
  return (
    <div className="cal-side-skeleton space-y-4 p-1" aria-busy aria-label="Loading day">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mx-auto size-28 rounded-full" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function HabitsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="habit-grid habit-grid-dense" aria-busy aria-label="Loading habits">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function HabitsPageShellSkeleton() {
  return (
    <div className="habits-page space-y-6" aria-busy aria-label="Loading habits">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <HabitsGridSkeleton />
    </div>
  );
}

export function TodayPageSkeleton() {
  return (
    <div className="today-page space-y-6" aria-busy aria-label="Loading today">
      <header className="space-y-3">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
      </header>
      <ul className="dash-stat-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="dash-stat dash-stat-row glass-panel">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-36" />
            </div>
          </li>
        ))}
      </ul>
      <section className="glass-panel space-y-4 p-4">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-2 w-full rounded-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </section>
    </div>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="stats-v2-skeleton space-y-4" aria-busy aria-label="Loading stats">
      <ul className="stats-v2-kpi-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="stats-v2-kpi-card glass-panel">
            <Skeleton className="mx-auto size-20 rounded-full" />
            <Skeleton className="mx-auto mt-3 h-4 w-24" />
            <Skeleton className="mx-auto mt-2 h-3 w-32" />
          </li>
        ))}
      </ul>
      <div className="stats-v2-grid">
        <div className="stats-v2-main space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="stats-v2-charts grid gap-4 md:grid-cols-2">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="hidden h-96 w-full rounded-2xl lg:block" />
      </div>
    </div>
  );
}

export function SettingsFormSkeleton() {
  return (
    <div className="settings-grid" aria-busy aria-label="Loading settings">
      {Array.from({ length: 4 }, (_, i) => (
        <section key={i} className="settings-card glass-panel space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </section>
      ))}
    </div>
  );
}

export function HabitDetailPageSkeleton() {
  return (
    <div className="habit-detail-page habit-detail-v2 space-y-6" aria-busy aria-label="Loading habit">
      <div className="flex justify-between gap-4">
        <Skeleton className="h-9 w-28 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
      <div className="habit-detail-v2-layout">
        <div className="habit-detail-v2-left space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="habit-detail-v2-right">
          <section className="glass-panel space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
            <CalendarGridSkeleton />
            <Skeleton className="h-24 w-full rounded-xl" />
          </section>
        </div>
      </div>
    </div>
  );
}
