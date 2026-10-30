"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, stagger } from "animejs";
import { motion, prefersReducedMotion } from "@/animations/config";
import { cn } from "@/lib/utils";

type AnimatedHabitCardProps = {
  children: ReactNode;
  index?: number;
  className?: string;
  /** Skip entrance (e.g. drag overlay). */
  skipEnter?: boolean;
};

export function AnimatedHabitCard({
  children,
  index = 0,
  className,
  skipEnter = false,
}: AnimatedHabitCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enterDelay = useRef(index);
  const hasPlayedEnter = useRef(false);

  useEffect(() => {
    if (skipEnter || prefersReducedMotion() || hasPlayedEnter.current) return;
    const root = ref.current;
    if (!root) return;
    const target =
      root.querySelector<HTMLElement>(".habit-card") ?? root;
    hasPlayedEnter.current = true;
    const anim = animate(target, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: motion.duration.card,
      delay: enterDelay.current * 60,
      ease: motion.easing.enter,
    });
    return () => {
      anim?.pause();
    };
  }, [skipEnter]);

  return (
    <div ref={ref} className={cn("habit-card-hover", className)}>
      {children}
    </div>
  );
}

/** Stagger grid children after filter/sort changes. */
export function useStaggerHabitGrid(
  containerRef: React.RefObject<HTMLElement | null>,
  itemSelector: string,
  deps: unknown[],
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion()) return;
    const items = root.querySelectorAll(itemSelector);
    if (!items.length) return;
    const anim = animate(items, {
      opacity: [0.6, 1],
      translateY: [6, 0],
      duration: motion.duration.normal,
      delay: stagger(45),
      ease: motion.easing.standard,
    });
    return () => {
      anim?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
