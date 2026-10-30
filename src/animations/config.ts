/** Shared motion tokens for Anime.js (v4 easing strings). */

export const motion = {
  duration: {
    instant: 100,
    fast: 180,
    button: 120,
    checkbox: 250,
    modal: 300,
    page: 250,
    card: 400,
    counter: 700,
    celebration: 600,
    progress: 900,
    normal: 300,
    expressive: 450,
  },
  easing: {
    standard: "out(3)",
    smooth: "inOut(3)",
    enter: "out(4)",
    spring: "outBack(1.7)",
  },
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
