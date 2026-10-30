import { animate, type JSAnimation } from "animejs";
import { motion, prefersReducedMotion } from "./config";

type AnimateOpts = Parameters<typeof animate>[1];

export function fadeUp(
  targets: Parameters<typeof animate>[0],
  options?: AnimateOpts,
): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  return animate(targets, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: motion.duration.card,
    ease: motion.easing.enter,
    ...options,
  });
}

export function fadeIn(
  targets: Parameters<typeof animate>[0],
  options?: AnimateOpts,
): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  return animate(targets, {
    opacity: [0, 1],
    duration: motion.duration.page,
    ease: motion.easing.standard,
    ...options,
  });
}

export function scaleTap(
  target: Element,
): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  return animate(target, {
    scale: [1, 0.96, 1],
    duration: motion.duration.button,
    ease: motion.easing.standard,
  });
}
