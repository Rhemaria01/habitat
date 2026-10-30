"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { animateWidthPercent } from "@/animations/progress-animations";
import { cn } from "@/lib/utils";

export type AnimatedBarHandle = {
  animateTo: (percent: number) => void;
};

type AnimatedBarProps = {
  percent: number;
  className?: string;
  barClassName?: string;
};

export const AnimatedBar = forwardRef<AnimatedBarHandle, AnimatedBarProps>(
  function AnimatedBar({ percent, className, barClassName }, ref) {
    const innerRef = useRef<HTMLSpanElement>(null);
    const animRef = useRef<ReturnType<typeof animateWidthPercent>>(null);

    useImperativeHandle(ref, () => ({
      animateTo(next: number) {
        if (!innerRef.current) return;
        animRef.current?.pause();
        animRef.current = animateWidthPercent(innerRef.current, next);
      },
    }));

    useEffect(() => {
      if (!innerRef.current) return;
      animRef.current?.pause();
      animRef.current = animateWidthPercent(innerRef.current, percent);
      return () => {
        animRef.current?.pause();
      };
    }, [percent]);

    return (
      <div className={cn("today-section-bar", className)} aria-hidden>
        <span ref={innerRef} className={barClassName} style={{ width: "0%" }} />
      </div>
    );
  },
);
