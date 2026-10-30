"use client";

import { useEffect, useRef, useState } from "react";
import { animateCountUp } from "@/animations/progress-animations";
import { cn } from "@/lib/utils";

type AnimatedCounterProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
};

export function AnimatedCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const from = mounted.current ? prev.current : 0;
    mounted.current = true;
    prev.current = value;
    const anim = animateCountUp(from, value, setDisplay, duration);
    return () => {
      anim?.pause();
    };
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
