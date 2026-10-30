"use client";

import { BotAvatar } from "bot-avatars";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  onHabitCompleted,
} from "@/animations/habit-events";
import {
  playMascotBlink,
  playMascotCelebrate,
  startMascotIdle,
} from "@/animations/mascot-animations";
import {
  HABITAT_PETS,
  PET_SIZE,
  petsEnabledForPath,
  type HabitatPet,
  type PetId,
} from "./constants";

type Vec = { x: number; y: number };

type PetMotion = {
  x: number;
  y: number;
  mode: "follow" | "rest";
  restUntil: number;
  nextRestCheck: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function initialMotion(pet: HabitatPet, index: number): PetMotion {
  const w = typeof window !== "undefined" ? window.innerWidth : 900;
  const h = typeof window !== "undefined" ? window.innerHeight : 700;
  const anchorX = w * 0.62 + index * 18;
  const anchorY = h * 0.58 + index * 14;
  return {
    x: anchorX + pet.followOffset.x,
    y: anchorY + pet.followOffset.y,
    mode: "follow",
    restUntil: 0,
    nextRestCheck: performance.now() + randomBetween(6000, 14000),
  };
}

function spawnBehindCalendar(index: number): Vec {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: w * (0.52 + index * 0.06) + randomBetween(-20, 20),
    y: h * (0.48 + index * 0.05) + randomBetween(8, 36),
  };
}

export function HabitatPets() {
  const pathname = usePathname();
  const enabled = petsEnabledForPath(pathname);

  const cursor = useRef<Vec>({ x: 0, y: 0 });
  const motion = useRef<Map<PetId, PetMotion>>(new Map());
  const petEls = useRef<Map<PetId, HTMLDivElement>>(new Map());
  const idleEls = useRef<Map<PetId, HTMLDivElement>>(new Map());
  const modeVisual = useRef<Map<PetId, PetMotion["mode"]>>(new Map());
  const [modes, setModes] = useState<Record<PetId, PetMotion["mode"]>>(() =>
    Object.fromEntries(HABITAT_PETS.map((p) => [p.id, "follow"])) as Record<
      PetId,
      PetMotion["mode"]
    >,
  );

  useEffect(() => {
    if (!enabled) return;
    for (const pet of HABITAT_PETS) {
      if (!motion.current.has(pet.id)) {
        motion.current.set(pet.id, initialMotion(pet, HABITAT_PETS.indexOf(pet)));
      }
    }
  }, [enabled]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    cursor.current = {
      x: window.innerWidth * 0.58,
      y: Math.min(window.innerHeight * 0.4, window.innerHeight - 280),
    };
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let stops: (() => void)[] = [];
    const mountId = requestAnimationFrame(() => {
      for (const pet of HABITAT_PETS) {
        const idle = idleEls.current.get(pet.id);
        if (idle) stops.push(startMascotIdle(idle));
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
        const m = motion.current.get(pet.id);
        const idle = idleEls.current.get(pet.id);
        if (idle && m?.mode === "follow") playMascotBlink(idle);
      }
    }, 4800);
    return () => {
      cancelAnimationFrame(mountId);
      stops.forEach((s) => s());
      offComplete();
      window.clearInterval(blinkTimer);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const step = (now: number) => {
      let modeDirty = false;
      for (let i = 0; i < HABITAT_PETS.length; i++) {
        const pet = HABITAT_PETS[i]!;
        const m = motion.current.get(pet.id);
        if (!m) continue;

        if (m.mode === "rest" && now >= m.restUntil) {
          m.mode = "follow";
          m.nextRestCheck = now + randomBetween(8000, 18000);
          const spawn = spawnBehindCalendar(i);
          m.x = spawn.x + pet.followOffset.x * 0.35;
          m.y = spawn.y + pet.followOffset.y * 0.35;
          const inner = idleEls.current.get(pet.id);
          if (inner) {
            inner.classList.remove("habitat-pet-pop");
            void inner.offsetWidth;
            inner.classList.add("habitat-pet-pop");
            window.setTimeout(() => inner.classList.remove("habitat-pet-pop"), 560);
          }
        }

        if (m.mode === "follow" && now >= m.nextRestCheck) {
          m.nextRestCheck = now + randomBetween(4000, 9000);
          if (Math.random() < 0.38) {
            m.mode = "rest";
            m.restUntil = now + randomBetween(3500, 11000);
            const spawn = spawnBehindCalendar(i);
            m.x = spawn.x + pet.followOffset.x * 0.25;
            m.y = spawn.y + pet.followOffset.y * 0.25;
          }
        }

        const prevMode = modeVisual.current.get(pet.id);
        if (prevMode !== m.mode) {
          modeVisual.current.set(pet.id, m.mode);
          modeDirty = true;
        }

        const target: Vec =
          m.mode === "rest"
            ? { x: m.x, y: m.y }
            : {
                x: cursor.current.x + pet.followOffset.x,
                y: cursor.current.y + pet.followOffset.y,
              };

        const speed = m.mode === "rest" ? 0.04 : 0.078;
        m.x = lerp(m.x, target.x, speed);
        m.y = lerp(m.y, target.y, speed);

        const el = petEls.current.get(pet.id);
        if (el) {
          el.style.transform = `translate3d(${m.x - PET_SIZE / 2}px, ${m.y - PET_SIZE / 2}px, 0)`;
        }
      }

      if (modeDirty) {
        setModes(
          Object.fromEntries(
            HABITAT_PETS.map((p) => [p.id, motion.current.get(p.id)?.mode ?? "follow"]),
          ) as Record<PetId, PetMotion["mode"]>,
        );
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled) return null;

  function renderPet(pet: (typeof HABITAT_PETS)[number]) {
    const resting = modes[pet.id] === "rest";
    return (
      <div
        key={pet.id}
        ref={(node) => {
          if (node) petEls.current.set(pet.id, node);
          else petEls.current.delete(pet.id);
        }}
        className={`habitat-pet ${resting ? "habitat-pet-resting" : ""}`}
        style={{ width: PET_SIZE, height: PET_SIZE }}
      >
        <div
          ref={(node) => {
            if (node) idleEls.current.set(pet.id, node);
            else idleEls.current.delete(pet.id);
          }}
          className="habitat-pet-inner"
        >
          <BotAvatar
            type={pet.type}
            state={resting ? "sleeping" : "default"}
            size={PET_SIZE}
            seed={pet.seed}
            interactive={false}
            face="mouth"
            shading="fabric"
            theme="auto"
            aria-hidden
          />
        </div>
        <span className="habitat-pet-name">{pet.name}</span>
      </div>
    );
  }

  const restingPets = HABITAT_PETS.filter((p) => modes[p.id] === "rest");
  const activePets = HABITAT_PETS.filter((p) => modes[p.id] !== "rest");

  return (
    <>
      <div className="habitat-pets-layer habitat-pets-layer--back" aria-hidden>
        {restingPets.map(renderPet)}
      </div>
      <div className="habitat-pets-layer habitat-pets-layer--front" aria-hidden>
        {activePets.map(renderPet)}
      </div>
    </>
  );
}
