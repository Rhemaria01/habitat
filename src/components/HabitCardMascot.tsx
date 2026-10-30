"use client";

import { BotAvatar } from "bot-avatars";
import { useMemo, type CSSProperties } from "react";
import {
  habitCardMascotVariant,
  HABIT_CARD_MASCOT_SIZE,
  type HabitCardMascotCorner,
} from "@/lib/habit-card-mascot-variant";
import { cn } from "@/lib/utils";

type HabitCardMascotProps = {
  habitId: string;
  index: number;
  gridColumns: number;
  total: number;
  layout?: "grid" | "list";
};

function habitatCornerClass(corner: HabitCardMascotCorner) {
  return `habitat-pet--corner-${corner}`;
}

/** One bot-avatar peeking from a card corner (clipped inside the card). */
export function HabitCardMascot({
  habitId,
  index,
  gridColumns,
  total,
  layout = "grid",
}: HabitCardMascotProps) {
  const variant = useMemo(
    () =>
      habitCardMascotVariant({
        habitId,
        index,
        columns: gridColumns,
        total,
        layout,
      }),
    [habitId, index, gridColumns, total, layout],
  );
  const size = layout === "list" ? 40 : HABIT_CARD_MASCOT_SIZE;

  return (
    <div className="habit-card-mascot-slot" aria-hidden>
      <div
        className={cn(
          "habitat-pet habitat-pet--anchored-corner habit-card-mascot-peek",
          habitatCornerClass(variant.corner),
        )}
        style={
          {
            width: size,
            height: size,
            "--pet-peek-x": "0px",
            "--pet-peek-y": "0px",
          } as CSSProperties
        }
      >
        <div className="habitat-pet-inner habitat-pet-inner--peek">
          <BotAvatar
            type={variant.type}
            face={variant.face}
            shading={variant.shading}
            hat={variant.hat}
            glasses={variant.glasses}
            headphones={variant.headphones}
            bowTie={variant.bowTie}
            brightness={variant.brightness}
            saturation={variant.saturation}
            seed={variant.seed}
            size={size}
            state="default"
            interactive
            turn={0.14}
            jumpEvery={0}
            theme="auto"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
