import { animate } from "animejs";
import { motion, prefersReducedMotion } from "@/animations/config";

/**
 * Animates a colored orb from a control (e.g. Done button) to a calendar day cell.
 */
export function flyHabitCompleteToCell(
  fromEl: HTMLElement,
  toEl: HTMLElement,
  color: string,
): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();

  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();

  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const endX = to.left + to.width / 2;
  const endY = to.top + to.height / 2;

  const orb = document.createElement("div");
  orb.className = "habit-complete-fly-orb";
  orb.style.setProperty("--fly-color", color);
  orb.style.left = `${startX}px`;
  orb.style.top = `${startY}px`;
  document.body.appendChild(orb);

  const ring = document.createElement("div");
  ring.className = "habit-complete-fly-trail";
  ring.style.setProperty("--fly-color", color);
  ring.style.left = `${startX}px`;
  ring.style.top = `${startY}px`;
  document.body.appendChild(ring);

  const dx = endX - startX;
  const dy = endY - startY;

  return new Promise((resolve) => {
    animate(orb, {
      translateX: [0, dx * 0.55, dx],
      translateY: [0, dy * 0.35 - 28, dy],
      scale: [0.45, 1.2, 0.4],
      opacity: [0.95, 1, 0],
      duration: motion.duration.expressive + 120,
      ease: motion.easing.smooth,
      onComplete: () => {
        orb.remove();
        resolve();
      },
    });

    animate(ring, {
      translateX: [0, dx],
      translateY: [0, dy],
      scale: [0.8, 2.4],
      opacity: [0.55, 0],
      duration: motion.duration.expressive + 80,
      ease: motion.easing.standard,
      onComplete: () => ring.remove(),
    });
  });
}
