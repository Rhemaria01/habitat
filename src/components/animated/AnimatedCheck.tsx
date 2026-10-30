"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  playHabitCompleteAnimation,
  playHabitUncheckAnimation,
} from "@/animations/habit-animations";

type AnimatedCheckProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
  onCompleteAnimation?: () => void;
};

export function AnimatedCheck({
  checked,
  onToggle,
  label,
  className,
  onCompleteAnimation,
}: AnimatedCheckProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const prevChecked = useRef(checked);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    if (checked && !prevChecked.current) {
      const row = btn.closest(".today-habit-row");
      if (row instanceof HTMLElement) {
        playHabitCompleteAnimation({
          row,
          check: btn,
          checkMark: pathRef.current,
        });
      }
      onCompleteAnimation?.();
    } else if (!checked && prevChecked.current) {
      playHabitUncheckAnimation(btn);
    }
    prevChecked.current = checked;
  }, [checked, onCompleteAnimation]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={cn("today-check", checked && "on", className)}
      aria-pressed={checked}
      aria-label={label}
      onClick={onToggle}
    >
      <svg
        className={cn(
          "today-check-mark",
          checked ? "opacity-100" : "opacity-0",
        )}
        viewBox="0 0 16 16"
        aria-hidden
      >
        <path
          ref={pathRef}
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
