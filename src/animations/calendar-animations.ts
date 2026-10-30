import { animate, stagger } from "animejs";
import { motion, prefersReducedMotion } from "./config";

export function animateCalendarCells(
  container: HTMLElement,
  selector: string,
): (() => void) | undefined {
  if (prefersReducedMotion()) return undefined;
  const cells = container.querySelectorAll(selector);
  if (!cells.length) return undefined;
  const anim = animate(cells, {
    scale: [0.94, 1],
    duration: motion.duration.normal,
    delay: stagger(22, { from: "center" }),
    ease: motion.easing.enter,
  });
  return () => {
    anim.pause();
    cells.forEach((el) => {
      (el as HTMLElement).style.opacity = "1";
      (el as HTMLElement).style.transform = "";
    });
  };
}

export function animateHeatmapCells(
  container: HTMLElement,
  selector: string,
): (() => void) | undefined {
  if (prefersReducedMotion()) return undefined;
  const cells = container.querySelectorAll(selector);
  if (!cells.length) return undefined;
  const anim = animate(cells, {
    opacity: [0.35, 1],
    duration: motion.duration.normal,
    delay: stagger(8),
    ease: motion.easing.standard,
  });
  return () => anim.pause();
}

export function pulseCalendarDay(cell: HTMLElement): void {
  if (prefersReducedMotion()) return;
  animate(cell, {
    scale: [1, 1.08, 1],
    duration: motion.duration.fast,
    ease: motion.easing.spring,
  });
}
