"use client";

import Image from "next/image";
import {
  HABIT_CARD_ART_OPTIONS,
  type HabitCardArtKey,
} from "@/lib/content/habit-card-art";
import { cn } from "@/lib/utils";

type HabitCardArtPickerProps = {
  value: HabitCardArtKey;
  onChange: (key: HabitCardArtKey) => void;
};

export function HabitCardArtPicker({ value, onChange }: HabitCardArtPickerProps) {
  return (
    <div className="habit-art-picker" role="radiogroup" aria-label="Card illustration">
      {HABIT_CARD_ART_OPTIONS.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            className={cn("habit-art-picker-btn", selected && "selected")}
            onClick={() => onChange(option.key)}
          >
            <Image
              src={option.src}
              alt=""
              width={64}
              height={64}
              className="habit-art-picker-img"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );
}
