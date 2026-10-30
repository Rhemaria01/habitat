"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { animateRingProgress } from "@/animations/progress-animations";
import { cn } from "@/lib/utils";

const R = 26;

export type AnimatedProgressRingHandle = {
  animateTo: (percent: number) => void;
};

type AnimatedProgressRingProps = {
  value: number | null;
  sublabel?: string;
  className?: string;
};

export const AnimatedProgressRing = forwardRef<
  AnimatedProgressRingHandle,
  AnimatedProgressRingProps
>(function AnimatedProgressRing({ value, sublabel, className }, ref) {
  const circleRef = useRef<SVGCircleElement>(null);
  const animRef = useRef<ReturnType<typeof animateRingProgress>>(null);

  const pct = value ?? 0;

  useImperativeHandle(ref, () => ({
    animateTo(next: number) {
      if (!circleRef.current) return;
      animRef.current?.pause();
      animRef.current = animateRingProgress(circleRef.current, next, R);
    },
  }));

  useEffect(() => {
    if (!circleRef.current) return;
    animRef.current?.pause();
    animRef.current = animateRingProgress(circleRef.current, pct, R);
    return () => {
      animRef.current?.pause();
    };
  }, [pct]);

  return (
    <div
      className={cn("dash-ring-wrap", className)}
      aria-label={value === null ? "No habits scheduled" : `${pct}% today`}
    >
      <div className="dash-ring">
        <svg viewBox="0 0 64 64" aria-hidden>
          <circle className="dash-ring-bg" cx="32" cy="32" r={R} />
          <circle
            ref={circleRef}
            className="dash-ring-val"
            cx="32"
            cy="32"
            r={R}
          />
        </svg>
        <span className="dash-ring-num">{value === null ? "—" : `${pct}%`}</span>
      </div>
      {sublabel ? <p className="dash-stat-sub">{sublabel}</p> : null}
    </div>
  );
});
