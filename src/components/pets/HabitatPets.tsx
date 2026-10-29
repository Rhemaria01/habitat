"use client";

import { BotAvatar } from "bot-avatars";
import {
  CircleDot,
  Moon,
  Sun,
  Utensils,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  DOCK_HEADER,
  DOCK_HEIGHT,
  DOCK_MARGIN,
  DOCK_WIDTH,
  HABITAT_PETS,
  PET_SIZE,
  type PetId,
} from "./constants";
import { cn } from "@/lib/utils";

type Vec = { x: number; y: number };

type BallPhase = "idle" | "waiting_throw" | "on_ground" | "carried" | "delivered";

type PetRuntime = {
  sleeping: boolean;
  fedActive: boolean;
  fetching: boolean;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function dist(a: Vec, b: Vec) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function homeSlots(viewW: number, viewH: number): Vec[] {
  const left = viewW - DOCK_MARGIN - DOCK_WIDTH;
  const top = viewH - DOCK_MARGIN - DOCK_HEIGHT;
  const homesTop = top + DOCK_HEADER + 10;
  const homesHeight = DOCK_HEIGHT - DOCK_HEADER - 18;
  const slotH = homesHeight / HABITAT_PETS.length;
  return HABITAT_PETS.map((_, i) => ({
    x: left + DOCK_WIDTH / 2,
    y: homesTop + slotH * i + slotH * 0.42,
  }));
}

function initialPetState(): Record<PetId, PetRuntime> {
  return {
    miso: { sleeping: false, fedActive: false, fetching: false },
    nova: { sleeping: false, fedActive: false, fetching: false },
    pip: { sleeping: false, fedActive: false, fetching: false },
  };
}

export function HabitatPets() {
  const cursor = useRef<Vec>({ x: 0, y: 0 });
  const positions = useRef<Record<PetId, Vec>>({
    miso: { x: 0, y: 0 },
    nova: { x: 0, y: 0 },
    pip: { x: 0, y: 0 },
  });
  const petEls = useRef<Record<PetId, HTMLDivElement | null>>({
    miso: null,
    nova: null,
    pip: null,
  });
  const ballEl = useRef<HTMLDivElement | null>(null);

  const [pets, setPets] = useState(initialPetState);
  const [ballPhase, setBallPhase] = useState<BallPhase>("idle");
  const [ballHolder, setBallHolder] = useState<PetId | null>(null);
  const [tick, setTick] = useState(0);

  const ballRef = useRef<{ pos: Vec; holder: PetId | null; phase: BallPhase }>({
    pos: { x: 0, y: 0 },
    holder: null,
    phase: "idle",
  });
  const petsRef = useRef(pets);

  useEffect(() => {
    petsRef.current = pets;
  }, [pets]);

  const syncBallRef = useCallback(
    (phase: BallPhase, holder: PetId | null, pos?: Vec) => {
      ballRef.current.phase = phase;
      ballRef.current.holder = holder;
      if (pos) ballRef.current.pos = pos;
      setBallPhase(phase);
      setBallHolder(holder);
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
    };
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    cursor.current = {
      x: window.innerWidth * 0.45,
      y: window.innerHeight * 0.4,
    };
    const homes = homeSlots(window.innerWidth, window.innerHeight);
    HABITAT_PETS.forEach((pet, i) => {
      positions.current[pet.id] = { ...homes[i] };
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const homes = homeSlots(w, h);
      const ball = ballRef.current;
      const runtime = petsRef.current;

      let carrier: PetId | null = ball.holder;
      if (ball.phase === "on_ground" && !carrier) {
        let closest: PetId | null = null;
        let closestD = Infinity;
        for (const pet of HABITAT_PETS) {
          const rt = runtime[pet.id];
          if (rt.sleeping) continue;
          const pos = positions.current[pet.id];
          const d = dist(pos, ball.pos);
          if (d < closestD) {
            closestD = d;
            closest = pet.id;
          }
        }
        if (closest && closestD < 28) {
          carrier = closest;
          ball.holder = closest;
          ball.phase = "carried";
          setBallHolder(closest);
          setBallPhase("carried");
          setPets((prev) => ({
            ...prev,
            [closest!]: { ...prev[closest!], fetching: true },
          }));
        }
      }

      for (const pet of HABITAT_PETS) {
        const rt = runtime[pet.id];
        const pos = positions.current[pet.id];
        let target: Vec;

        if (rt.sleeping) {
          target = homes[HABITAT_PETS.findIndex((p) => p.id === pet.id)];
        } else if (ball.phase === "on_ground" && !rt.sleeping) {
          target = ball.pos;
        } else if (ball.holder === pet.id && ball.phase === "carried") {
          target = cursor.current;
        } else if (ball.phase === "waiting_throw") {
          target = {
            x: cursor.current.x + pet.followOffset.x,
            y: cursor.current.y + pet.followOffset.y,
          };
        } else {
          target = {
            x: cursor.current.x + pet.followOffset.x,
            y: cursor.current.y + pet.followOffset.y,
          };
        }

        const speed =
          ball.holder === pet.id && ball.phase === "carried"
            ? 0.14
            : ball.phase === "on_ground" && !rt.sleeping
              ? 0.11
              : rt.sleeping
                ? 0.09
                : 0.085;

        pos.x = lerp(pos.x, target.x, speed);
        pos.y = lerp(pos.y, target.y, speed);

        if (
          ball.holder === pet.id &&
          ball.phase === "carried" &&
          dist(pos, cursor.current) < 36
        ) {
          ball.phase = "delivered";
          ball.holder = null;
          ball.pos = { ...cursor.current };
          setBallPhase("delivered");
          setBallHolder(null);
          setPets((prev) => ({
            ...prev,
            [pet.id]: { ...prev[pet.id], fetching: false },
          }));
          window.setTimeout(() => {
            ball.phase = "idle";
            setBallPhase("idle");
          }, 400);
        }

        const el = petEls.current[pet.id];
        if (el) {
          el.style.transform = `translate3d(${pos.x - PET_SIZE / 2}px, ${pos.y - PET_SIZE / 2}px, 0)`;
        }
      }

      if (ball.phase === "on_ground" || ball.phase === "delivered") {
        const bel = ballEl.current;
        if (bel) {
          bel.style.transform = `translate3d(${ball.pos.x - 7}px, ${ball.pos.y - 7}px, 0)`;
          bel.style.opacity = ball.phase === "delivered" ? "0.35" : "1";
        }
      } else if (ball.phase === "carried" && ball.holder) {
        const p = positions.current[ball.holder];
        ball.pos = { x: p.x + 18, y: p.y + 6 };
        const bel = ballEl.current;
        if (bel) {
          bel.style.opacity = "1";
          bel.style.transform = `translate3d(${ball.pos.x - 7}px, ${ball.pos.y - 7}px, 0)`;
        }
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dockRect = useMemo(() => {
    void tick;
    if (typeof window === "undefined") {
      return { left: 0, top: 0 };
    }
    return {
      left: window.innerWidth - DOCK_MARGIN - DOCK_WIDTH,
      top: window.innerHeight - DOCK_MARGIN - DOCK_HEIGHT,
    };
  }, [tick]);

  const setSleeping = (id: PetId, sleeping: boolean) => {
    setPets((prev) => ({
      ...prev,
      [id]: { ...prev[id], sleeping, fetching: sleeping ? false : prev[id].fetching },
    }));
    if (sleeping && ballRef.current.holder === id) {
      syncBallRef("on_ground", null, ballRef.current.pos);
    }
    toast.message(
      sleeping ? `${nameFor(id)} is napping.` : `${nameFor(id)} is up!`,
      { duration: 1800 },
    );
  };

  const feedPet = (id: PetId) => {
    if (pets[id].sleeping) {
      toast.message("They're asleep — wake them first.", { duration: 2000 });
      return;
    }
    setPets((prev) => ({
      ...prev,
      [id]: { ...prev[id], fedActive: true },
    }));
    window.setTimeout(() => {
      setPets((prev) => ({
        ...prev,
        [id]: { ...prev[id], fedActive: false },
      }));
    }, 4000);
    toast.success(`Fed ${nameFor(id)}`, { duration: 1600 });
  };

  const startBallGame = () => {
    const anyAwake = HABITAT_PETS.some((p) => !pets[p.id].sleeping);
    if (!anyAwake) {
      toast.message("Wake a pet to play ball.", { duration: 2000 });
      return;
    }
    syncBallRef("waiting_throw", null);
    toast.message("Click anywhere to throw the ball.", { duration: 2800 });
  };

  const cancelBall = () => {
    syncBallRef("idle", null);
    setPets((prev) => {
      const next = { ...prev };
      for (const p of HABITAT_PETS) {
        next[p.id] = { ...next[p.id], fetching: false };
      }
      return next;
    });
  };

  const onThrowLayerClick = (e: React.MouseEvent) => {
    if (ballRef.current.phase !== "waiting_throw") return;
    const pos = { x: e.clientX, y: e.clientY };
    ballRef.current.pos = pos;
    syncBallRef("on_ground", null, pos);
    const bel = ballEl.current;
    if (bel) {
      bel.style.opacity = "1";
      bel.style.transform = `translate3d(${pos.x - 7}px, ${pos.y - 7}px, 0)`;
    }
  };

  const showBall =
    ballPhase === "on_ground" ||
    ballPhase === "carried" ||
    ballPhase === "delivered";

  return (
    <>
      {ballPhase === "waiting_throw" ? (
        <button
          type="button"
          className="habitat-pets-throw-layer"
          aria-label="Click to throw the ball"
          onClick={onThrowLayerClick}
        />
      ) : null}

      <div className="habitat-pets-layer" aria-hidden={false}>
        {HABITAT_PETS.map((pet) => {
          const rt = pets[pet.id];
          const state = rt.sleeping
            ? "sleeping"
              : rt.fetching || ballHolder === pet.id
              ? "working"
              : rt.fedActive
                ? "working"
                : "default";

          if (rt.sleeping) {
            return null;
          }

          return (
            <div
              key={pet.id}
              ref={(node) => {
                petEls.current[pet.id] = node;
              }}
              className="habitat-pet"
              style={{
                width: PET_SIZE,
                height: PET_SIZE,
              }}
            >
              <BotAvatar
                type={pet.type}
                state={state}
                size={PET_SIZE}
                seed={pet.seed}
                interactive={!rt.sleeping}
                face="mouth"
                shading="fabric"
                theme="auto"
                aria-label={`${pet.name}, ${rt.sleeping ? "sleeping" : "awake"}`}
              />
              {!rt.sleeping && ballPhase === "idle" ? (
                <span className="habitat-pet-name">{pet.name}</span>
              ) : null}
            </div>
          );
        })}

        {showBall ? (
          <div ref={ballEl} className="habitat-pet-ball" aria-hidden />
        ) : null}
      </div>

      <aside
        className="habitat-pets-dock"
        style={{
          left: dockRect.left,
          top: dockRect.top,
          width: DOCK_WIDTH,
          height: DOCK_HEIGHT,
        }}
        aria-label="Pet homes"
      >
        <div className="habitat-pets-dock-head">
          <span className="habitat-pets-dock-title">Pet nook</span>
          {ballPhase === "waiting_throw" ? (
            <button
              type="button"
              className="habitat-pets-dock-cancel"
              onClick={cancelBall}
              aria-label="Cancel ball game"
            >
              <X size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="habitat-pets-dock-ball"
              onClick={startBallGame}
              aria-label="Play ball"
            >
              <CircleDot size={15} />
              Ball
            </button>
          )}
        </div>

        <div className="habitat-pets-homes">
          {HABITAT_PETS.map((pet) => {
            const rt = pets[pet.id];
            return (
              <div key={pet.id} className="habitat-pet-home">
                <div
                  className={cn(
                    "habitat-pet-bed",
                    rt.sleeping && "habitat-pet-bed-occupied",
                  )}
                >
                  {rt.sleeping ? (
                    <BotAvatar
                      type={pet.type}
                      state="sleeping"
                      size={40}
                      seed={pet.seed}
                      interactive={false}
                      face="mouth"
                      shading="fabric"
                      theme="auto"
                      aria-hidden
                    />
                  ) : (
                    <span className="habitat-pet-bed-empty" aria-hidden>
                      ◡
                    </span>
                  )}
                </div>
                <p className="habitat-pet-home-name">{pet.name}</p>
                <div className="habitat-pet-home-actions">
                  <button
                    type="button"
                    className="habitat-pet-action"
                    title="Put to sleep"
                    disabled={rt.sleeping}
                    onClick={() => setSleeping(pet.id, true)}
                  >
                    <Moon size={13} />
                  </button>
                  <button
                    type="button"
                    className="habitat-pet-action"
                    title="Wake up"
                    disabled={!rt.sleeping}
                    onClick={() => setSleeping(pet.id, false)}
                  >
                    <Sun size={13} />
                  </button>
                  <button
                    type="button"
                    className="habitat-pet-action"
                    title="Feed"
                    onClick={() => feedPet(pet.id)}
                  >
                    <Utensils size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

function nameFor(id: PetId) {
  return HABITAT_PETS.find((p) => p.id === id)?.name ?? id;
}
