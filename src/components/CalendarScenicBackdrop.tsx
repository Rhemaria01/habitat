"use client";

import { useSyncExternalStore } from "react";
import { scenicBackgroundNow } from "@/lib/time-of-day";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type CalendarScenicBackdropProps = {
  /** Sidebar wash vs edge-to-edge under the month grid. */
  variant?: "panel" | "fill";
};

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function subscribeTheme(onStoreChange: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(onStoreChange);
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function CalendarScenicBackdrop({
  variant = "panel",
}: CalendarScenicBackdropProps) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark");
  const photo = scenicBackgroundNow(theme);

  return (
    <div
      className={cn(
        "calendar-scenic-backdrop",
        variant === "fill" && "calendar-scenic-backdrop--fill",
      )}
      aria-hidden
    >
      <div
        className="calendar-scenic-backdrop-photo"
        style={{ backgroundImage: `url(${photo})` }}
      />
      <div className="calendar-scenic-backdrop-scrim" />
    </div>
  );
}
