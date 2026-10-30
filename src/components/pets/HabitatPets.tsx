"use client";

import { BotAvatar } from "bot-avatars";
import { Moon, Sun, Utensils } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  DOCK_HEIGHT,
  DOCK_MARGIN,
  DOCK_WIDTH,
  PET_SIZE,
  petForPathname,
  type HabitatPet,
} from "./constants";
import { cn } from "@/lib/utils";

type Vec = { x: number; y: number };

type PetRuntime = {
  sleeping: boolean;
  fedActive: boolean;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function dockInsets(viewW: number) {
  const tabbarClearance = viewW < 960 ? 5 * 16 : 0;
  return {
    right: DOCK_MARGIN,
    bottom: DOCK_MARGIN + tabbarClearance,
  };
}

function homeSlot(viewW: number, viewH: number): Vec {
  const { right, bottom } = dockInsets(viewW);
  return {
    x: viewW - right - DOCK_WIDTH / 2,
    y: viewH - bottom - DOCK_HEIGHT / 2 + 6,
  };
}

function emptyRuntime(): PetRuntime {
  return { sleeping: false, fedActive: false };
}

export function HabitatPets() {
  const pathname = usePathname();
  const activePet = useMemo(() => petForPathname(pathname), [pathname]);

  const cursor = useRef<Vec>({ x: 0, y: 0 });
  const position = useRef<Vec>({ x: 0, y: 0 });
  const petEl = useRef<HTMLDivElement | null>(null);

  const [runtime, setRuntime] = useState<PetRuntime>(emptyRuntime);
  const [tick, setTick] = useState(0);

  const runtimeRef = useRef(runtime);
  const petRef = useRef<HabitatPet | null>(activePet);

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  useEffect(() => {
    petRef.current = activePet;
  }, [activePet]);

  useEffect(() => {
    setRuntime(emptyRuntime());
  }, [activePet?.id]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
    };
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    cursor.current = {
      x: window.innerWidth * 0.58,
      y: Math.min(window.innerHeight * 0.32, window.innerHeight - 280),
    };
    position.current = {
      x: cursor.current.x + (petRef.current?.followOffset.x ?? 0),
      y: cursor.current.y + (petRef.current?.followOffset.y ?? 0),
    };
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!activePet) return;
    let raf = 0;
    const step = () => {
      const pet = petRef.current;
      if (!pet) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const home = homeSlot(w, h);
      const rt = runtimeRef.current;
      const pos = position.current;

      const target: Vec = rt.sleeping
        ? home
        : {
            x: cursor.current.x + pet.followOffset.x,
            y: cursor.current.y + pet.followOffset.y,
          };

      const speed = rt.sleeping ? 0.09 : 0.085;

      pos.x = lerp(pos.x, target.x, speed);
      pos.y = lerp(pos.y, target.y, speed);

      const el = petEl.current;
      if (el) {
        el.style.transform = `translate3d(${pos.x - PET_SIZE / 2}px, ${pos.y - PET_SIZE / 2}px, 0)`;
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [activePet?.id]);

  const dockRect = useMemo(() => {
    void tick;
    if (typeof window === "undefined") {
      return { right: 0, bottom: 0 };
    }
    return dockInsets(window.innerWidth);
  }, [tick]);

  if (!activePet) return null;

  const setSleeping = (sleeping: boolean) => {
    setRuntime((prev) => ({ ...prev, sleeping }));
    toast.message(
      sleeping ? `${activePet.name} is napping.` : `${activePet.name} is up!`,
      { duration: 1800 },
    );
  };

  const feedPet = () => {
    if (runtime.sleeping) {
      toast.message("They're asleep — wake them first.", { duration: 2000 });
      return;
    }
    setRuntime((prev) => ({ ...prev, fedActive: true }));
    window.setTimeout(() => {
      setRuntime((prev) => ({ ...prev, fedActive: false }));
    }, 4000);
    toast.success(`Fed ${activePet.name}`, { duration: 1600 });
  };

  const avatarState = runtime.sleeping
    ? "sleeping"
    : runtime.fedActive
      ? "working"
      : "default";

  return (
    <>
      <div className="habitat-pets-layer" aria-hidden={false}>
        {!runtime.sleeping ? (
          <div
            ref={petEl}
            className="habitat-pet"
            style={{
              width: PET_SIZE,
              height: PET_SIZE,
            }}
          >
            <BotAvatar
              type={activePet.type}
              state={avatarState}
              size={PET_SIZE}
              seed={activePet.seed}
              interactive={!runtime.sleeping}
              face="mouth"
              shading="fabric"
              theme="auto"
              aria-label={`${activePet.name}, awake`}
            />
            <span className="habitat-pet-name">{activePet.name}</span>
          </div>
        ) : null}
      </div>

      <aside
        className="habitat-pets-dock habitat-pets-dock-single"
        style={{
          right: dockRect.right,
          bottom: dockRect.bottom,
          left: "auto",
          width: DOCK_WIDTH,
          height: DOCK_HEIGHT,
        }}
        aria-label={`${activePet.name}'s nook`}
      >
        <div className="habitat-pets-dock-head">
          <span className="habitat-pets-dock-title">{activePet.name}&apos;s nook</span>
        </div>

        <div className="habitat-pets-homes habitat-pets-homes-single">
          <div className="habitat-pet-home">
            <div
              className={cn(
                "habitat-pet-bed",
                runtime.sleeping && "habitat-pet-bed-occupied",
              )}
            >
              {runtime.sleeping ? (
                <BotAvatar
                  type={activePet.type}
                  state="sleeping"
                  size={40}
                  seed={activePet.seed}
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
            <p className="habitat-pet-home-name">{activePet.name}</p>
            <div className="habitat-pet-home-actions">
              <button
                type="button"
                className="habitat-pet-action"
                title="Put to sleep"
                disabled={runtime.sleeping}
                onClick={() => setSleeping(true)}
              >
                <Moon size={13} />
              </button>
              <button
                type="button"
                className="habitat-pet-action"
                title="Wake up"
                disabled={!runtime.sleeping}
                onClick={() => setSleeping(false)}
              >
                <Sun size={13} />
              </button>
              <button
                type="button"
                className="habitat-pet-action"
                title="Feed"
                onClick={feedPet}
              >
                <Utensils size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
