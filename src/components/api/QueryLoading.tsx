"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type QueryLoadingOverlayProps = {
  show: boolean;
  label?: string;
  className?: string;
};

export function QueryLoadingOverlay({
  show,
  label = "Loading…",
  className,
}: QueryLoadingOverlayProps) {
  if (!show) return null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/55 backdrop-blur-[1px]",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {label}
      </span>
    </div>
  );
}

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
    <div className="cal-side-skeleton space-y-4 p-1" aria-hidden>
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
    <div className="habit-grid habit-grid-dense" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl" />
      ))}
    </div>
  );
}
