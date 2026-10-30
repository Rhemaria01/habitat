"use client";

import { BotAvatar } from "bot-avatars";
import { useEffect, useRef, type CSSProperties } from "react";
import { onHabitCompleted } from "@/animations/habit-events";
import {
  playMascotBlink,
  playMascotCelebrate,
  startMascotIdle,
} from "@/animations/mascot-animations";
import { getPet, PET_SIZE, type PetId } from "@/components/pets/constants";

function cornerClass(corner: "top-left" | "top-right") {
  return `habitat-pet--corner-${corner}`;
}

type PanelCornerMascotsProps = {
  petIds: readonly PetId[];
  size?: number;
};

export const CALENDAR_PANEL_PET_IDS = ["nova", "miso"] as const satisfies readonly PetId[];
export const TODAY_PANEL_PET_IDS = ["miso"] as const satisfies readonly PetId[];
export const STATS_PANEL_PET_IDS = ["nova", "miso"] as const satisfies readonly PetId[];
/** Slightly larger peek on Today / Stats habit panels. */
export const TABLE_PANEL_MASCOT_SIZE = 62;

export function PanelCornerMascots({ petIds, size = PET_SIZE }: PanelCornerMascotsProps) {
  const idleEls = useRef<Map<PetId, HTMLDivElement>>(new Map());
  const popped = useRef<Set<PetId>>(new Set());

  useEffect(() => {
    let stops: (() => void)[] = [];
    const mountId = requestAnimationFrame(() => {
      for (const id of petIds) {
        const idle = idleEls.current.get(id);
        if (!idle) continue;
        stops.push(startMascotIdle(idle));
        if (!popped.current.has(id)) {
          idle.classList.remove("habitat-pet-pop");
          void idle.offsetWidth;
          idle.classList.add("habitat-pet-pop");
          window.setTimeout(() => idle.classList.remove("habitat-pet-pop"), 560);
          popped.current.add(id);
        }
      }
    });
    const offComplete = onHabitCompleted(() => {
      for (const id of petIds) {
        const idle = idleEls.current.get(id);
        if (idle) playMascotCelebrate(idle);
      }
    });
    const blinkTimer = window.setInterval(() => {
      for (const id of petIds) {
        const idle = idleEls.current.get(id);
        if (idle) playMascotBlink(idle);
      }
    }, 4800);
    return () => {
      cancelAnimationFrame(mountId);
      stops.forEach((s) => s());
      offComplete();
      window.clearInterval(blinkTimer);
    };
  }, [petIds.join(",")]);

  return (
    <div className="habitat-panel-mascot-slots" aria-hidden>
      {petIds.map((id) => {
        const pet = getPet(id);
        const corner =
          pet.anchor.corner === "top-left" || pet.anchor.corner === "top-right"
            ? pet.anchor.corner
            : "top-left";
        return (
          <div
            key={pet.id}
            className={`habitat-pet habitat-pet--anchored-corner habitat-panel-mascot-peek ${cornerClass(corner)}`}
            style={
              {
                width: size,
                height: size,
                "--pet-peek-x": `${pet.anchor.offset.x}px`,
                "--pet-peek-y": `${pet.anchor.offset.y}px`,
              } as CSSProperties
            }
          >
            <div
              ref={(node) => {
                if (node) idleEls.current.set(pet.id, node);
                else idleEls.current.delete(pet.id);
              }}
              className="habitat-pet-inner habitat-pet-inner--peek"
            >
              <BotAvatar
                type={pet.type}
                state="default"
                size={size}
                seed={pet.seed}
                interactive
                turn={0.12}
                jumpEvery={0}
                face="mouth"
                shading="fabric"
                theme="auto"
                aria-hidden
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
