"use client";

import { BotAvatar } from "bot-avatars";
import { useEffect, useRef } from "react";
import {
  playMascotBlink,
  startMascotIdle,
} from "@/animations/mascot-animations";
import {
  STATS_INSIGHT_PET,
  STATS_INSIGHT_PET_SIZE,
} from "@/components/pets/stats-insight-pet";

export function StatsInsightPet() {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const stopIdle = startMascotIdle(inner);
    const blinkTimer = window.setInterval(() => {
      playMascotBlink(inner);
    }, 5200);
    return () => {
      stopIdle();
      window.clearInterval(blinkTimer);
    };
  }, []);

  return (
    <div
      className="stats-insight-pet habitat-pet habitat-pet--anchored"
      style={{ width: STATS_INSIGHT_PET_SIZE, height: STATS_INSIGHT_PET_SIZE }}
      aria-hidden
    >
      <div ref={innerRef} className="habitat-pet-inner">
        <BotAvatar
          type={STATS_INSIGHT_PET.type}
          state="default"
          size={STATS_INSIGHT_PET_SIZE}
          seed={STATS_INSIGHT_PET.seed}
          interactive={false}
          face="mouth"
          shading="fabric"
          theme="auto"
          aria-hidden
        />
      </div>
      <span className="habitat-pet-name stats-insight-pet-name">
        {STATS_INSIGHT_PET.name}
      </span>
    </div>
  );
}
