import { animate, type JSAnimation } from "animejs";
import { motion, prefersReducedMotion } from "./config";

export function animateRingProgress(
  circle: SVGCircleElement,
  percent: number,
  radius: number,
): JSAnimation | null {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  circle.style.strokeDasharray = `${circumference}`;
  if (prefersReducedMotion()) {
    circle.style.strokeDashoffset = `${offset}`;
    return null;
  }

  const from =
    circle.style.strokeDashoffset !== ""
      ? Number.parseFloat(circle.style.strokeDashoffset)
      : circumference;

  return animate(circle, {
    strokeDashoffset: [from, offset],
    duration: motion.duration.progress,
    ease: motion.easing.smooth,
  });
}

export function animateWidthPercent(
  el: HTMLElement,
  percent: number,
): JSAnimation | null {
  const target = `${Math.min(100, Math.max(0, percent))}%`;
  if (prefersReducedMotion()) {
    el.style.width = target;
    return null;
  }
  return animate(el, {
    width: target,
    duration: motion.duration.progress,
    ease: motion.easing.smooth,
  });
}

export function animateCountUp(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  duration?: number,
): JSAnimation | null {
  if (prefersReducedMotion()) {
    onUpdate(to);
    return null;
  }
  const dur = duration ?? motion.duration.counter;
  const state = { value: from };
  return animate(state, {
    value: to,
    duration: dur,
    ease: motion.easing.smooth,
    onUpdate: () => onUpdate(state.value),
  });
}
