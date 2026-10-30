import { animate, createTimeline, type JSAnimation } from "animejs";
import { motion, prefersReducedMotion } from "./config";

let idleAnim: JSAnimation | null = null;

export function startMascotIdle(petEl: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};

  idleAnim?.pause();
  idleAnim = animate(petEl, {
    translateY: [0, -3, 0],
    duration: 2800,
    ease: motion.easing.smooth,
    loop: true,
    alternate: true,
  });

  return () => {
    idleAnim?.pause();
    idleAnim = null;
    petEl.style.transform = "";
  };
}

export function playMascotCelebrate(petEl: HTMLElement): void {
  if (prefersReducedMotion()) return;
  if (Math.random() > 0.35) return;

  const tl = createTimeline({ defaults: { ease: motion.easing.spring } });
  tl.add(petEl, {
    scale: [1, 1.12, 1],
    rotate: [0, -6, 6, 0],
    duration: motion.duration.celebration,
  });
}

export function playMascotBlink(petEl: HTMLElement): void {
  if (prefersReducedMotion()) return;
  if (Math.random() > 0.08) return;
  animate(petEl, {
    scaleY: [1, 0.92, 1],
    duration: motion.duration.fast,
    ease: motion.easing.standard,
  });
}
