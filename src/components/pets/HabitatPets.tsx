"use client";

import { BotAvatar } from "bot-avatars";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { onHabitCompleted } from "@/animations/habit-events";
import {
  playMascotBlink,
  playMascotCelebrate,
  startMascotIdle,
} from "@/animations/mascot-animations";
import {
  HABITAT_PETS,
  PET_SIZE,
  petsEnabledForPath,
  type PetAnchorCorner,
  type PetId,
} from "./constants";
import { usePetCardHost } from "./usePetCardHost";

function triggerPop(inner: HTMLElement) {
  inner.classList.remove("habitat-pet-pop");
  void inner.offsetWidth;
  inner.classList.add("habitat-pet-pop");
  window.setTimeout(() => inner.classList.remove("habitat-pet-pop"), 560);
}

function cornerClass(corner: PetAnchorCorner) {
  return `habitat-pet--corner-${corner}`;
}

export function HabitatPets() {
  const pathname = usePathname();
  const enabled = petsEnabledForPath(pathname);
  const cardHost = usePetCardHost(enabled);

  const idleEls = useRef<Map<PetId, HTMLDivElement>>(new Map());
  const popped = useRef<Set<PetId>>(new Set());

  useEffect(() => {
    if (!enabled || !cardHost) return;
    let stops: (() => void)[] = [];
    const mountId = requestAnimationFrame(() => {
      for (const pet of HABITAT_PETS) {
        const idle = idleEls.current.get(pet.id);
        if (idle) {
          stops.push(startMascotIdle(idle));
          if (!popped.current.has(pet.id)) {
            triggerPop(idle);
            popped.current.add(pet.id);
          }
        }
      }
    });
    const offComplete = onHabitCompleted(() => {
      for (const pet of HABITAT_PETS) {
        const idle = idleEls.current.get(pet.id);
        if (idle) playMascotCelebrate(idle);
      }
    });
    const blinkTimer = window.setInterval(() => {
      for (const pet of HABITAT_PETS) {
        const idle = idleEls.current.get(pet.id);
        if (idle) playMascotBlink(idle);
      }
    }, 4800);
    return () => {
      cancelAnimationFrame(mountId);
      stops.forEach((s) => s());
      offComplete();
      window.clearInterval(blinkTimer);
    };
  }, [enabled, cardHost]);

  useEffect(() => {
    popped.current.clear();
  }, [cardHost, pathname]);

  if (!enabled || !cardHost) return null;

  return createPortal(
    <div className="habitat-pet-slots" aria-hidden>
      {HABITAT_PETS.map((pet) => (
        <div
          key={pet.id}
          className={`habitat-pet habitat-pet--anchored-corner ${cornerClass(pet.anchor.corner)}`}
          style={
            {
              width: PET_SIZE,
              height: PET_SIZE,
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
              size={PET_SIZE}
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
          <span className="habitat-pet-name">{pet.name}</span>
        </div>
      ))}
    </div>,
    cardHost,
  );
}
