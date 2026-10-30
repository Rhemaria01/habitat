"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/animations/config";
import { cn } from "@/lib/utils";

type HabitCardCornerArtProps = {
  src: string;
  className?: string;
};

const HOVER_STRENGTH = 0.22;
const HOVER_MAX_PX = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function entryDirection(
  entryX: number,
  entryY: number,
  cardW: number,
  cardH: number,
): { x: number; y: number } {
  const cx = cardW / 2;
  const cy = cardH / 2;
  const dx = entryX - cx;
  const dy = entryY - cy;
  const len = Math.hypot(dx, dy);

  if (len >= 10) {
    return { x: dx / len, y: dy / len };
  }

  const distLeft = entryX;
  const distRight = cardW - entryX;
  const distTop = entryY;
  const distBottom = cardH - entryY;
  const min = Math.min(distLeft, distRight, distTop, distBottom);

  if (min === distLeft) return { x: -1, y: 0 };
  if (min === distRight) return { x: 1, y: 0 };
  if (min === distTop) return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

export function HabitCardCornerArt({ src, className }: HabitCardCornerArtProps) {
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const art = artRef.current;
    if (!art) return;

    const card = art.closest<HTMLElement>(".habit-card");
    if (!card) return;

    function paint(scrollY: number, hoverX: number, hoverY: number) {
      art!.style.setProperty("--corner-x", `${hoverX}px`);
      art!.style.setProperty("--corner-y", `${hoverY + scrollY}px`);
    }

    let scrollY = 0;
    let hoverX = 0;
    let hoverY = 0;
    let entryX = 0;
    let entryY = 0;
    let entryDirX = 0;
    let entryDirY = 1;
    let tracking = false;
    let raf: number | null = null;

    function schedule() {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        paint(scrollY, hoverX, hoverY);
      });
    }

    function onScroll() {
      const rect = card!.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = rect.top + rect.height * 0.5;
      const t = (center - vh * 0.5) / vh;
      scrollY = -t * 4;
      schedule();
    }

    function beginPointerTrack(event: PointerEvent) {
      const rect = card!.getBoundingClientRect();
      entryX = event.clientX - rect.left;
      entryY = event.clientY - rect.top;
      const dir = entryDirection(entryX, entryY, rect.width, rect.height);
      entryDirX = dir.x;
      entryDirY = dir.y;
      tracking = true;
      applyPointerParallax(event);
    }

    function applyPointerParallax(event: PointerEvent) {
      const rect = card!.getBoundingClientRect();
      const curX = event.clientX - rect.left;
      const curY = event.clientY - rect.top;
      const along =
        (curX - entryX) * entryDirX + (curY - entryY) * entryDirY;
      const magnitude = clamp(along * HOVER_STRENGTH, -HOVER_MAX_PX, HOVER_MAX_PX);
      hoverX = entryDirX * magnitude;
      hoverY = entryDirY * magnitude;
      schedule();
    }

    function onPointerEnter(event: PointerEvent) {
      beginPointerTrack(event);
    }

    function onPointerMove(event: PointerEvent) {
      if (!tracking) {
        beginPointerTrack(event);
        return;
      }
      applyPointerParallax(event);
    }

    function onPointerLeave() {
      tracking = false;
      hoverX = 0;
      hoverY = 0;
      schedule();
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    card.addEventListener("pointerenter", onPointerEnter);
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      card.removeEventListener("pointerenter", onPointerEnter);
      card.removeEventListener("pointermove", onPointerMove);
      card.removeEventListener("pointerleave", onPointerLeave);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={artRef} className={cn("habit-card-corner-art", className)} aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 640px) 55vw, 360px"
        className="habit-card-corner-art-img"
        draggable={false}
      />
    </div>
  );
}
