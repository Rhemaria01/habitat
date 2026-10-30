import { animate, type JSAnimation } from "animejs";
import { motion, prefersReducedMotion } from "./config";

export function enterPage(root: HTMLElement): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  return animate(root, {
    opacity: [0, 1],
    translateY: [8, 0],
    duration: motion.duration.page,
    ease: motion.easing.enter,
  });
}
