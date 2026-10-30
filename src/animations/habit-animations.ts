import { animate, createTimeline } from "animejs";
import { motion, prefersReducedMotion } from "./config";
import { emitHabitCompleted } from "./habit-events";

export type HabitCompleteTargets = {
  row: HTMLElement;
  check: HTMLElement;
  checkMark?: SVGPathElement | null;
};

export function playHabitCompleteAnimation(targets: HabitCompleteTargets): void {
  if (prefersReducedMotion()) {
    emitHabitCompleted();
    return;
  }

  const tl = createTimeline({
    defaults: { ease: motion.easing.spring },
  });

  tl.add(targets.check, {
    scale: [1, 1.14, 1],
    duration: motion.duration.checkbox,
  });

  if (targets.checkMark) {
    const len = targets.checkMark.getTotalLength?.() ?? 24;
    targets.checkMark.style.strokeDasharray = `${len}`;
    targets.checkMark.style.strokeDashoffset = `${len}`;
    tl.add(
      targets.checkMark,
      {
        strokeDashoffset: [len, 0],
        duration: motion.duration.checkbox,
        ease: motion.easing.smooth,
      },
      0,
    );
  }

  tl.add(
    targets.row,
    {
      backgroundColor: [
        "rgba(143, 169, 146, 0)",
        "rgba(143, 169, 146, 0.14)",
        "rgba(143, 169, 146, 0)",
      ],
      duration: motion.duration.expressive,
      ease: motion.easing.smooth,
    },
    80,
  );

  emitHabitCompleted();
}

export function playHabitUncheckAnimation(check: HTMLElement): void {
  if (prefersReducedMotion()) return;
  animate(check, {
    scale: [1, 0.92, 1],
    duration: motion.duration.fast,
    ease: motion.easing.standard,
  });
}
