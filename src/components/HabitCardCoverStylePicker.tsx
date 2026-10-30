"use client";

import {
  HABIT_CARD_COVER_STYLE_OPTIONS,
  type HabitCardCoverStyle,
} from "@/lib/content/habit-card-cover";
import { cn } from "@/lib/utils";

type HabitCardCoverStylePickerProps = {
  value: HabitCardCoverStyle;
  onChange: (style: HabitCardCoverStyle) => void;
};

export function HabitCardCoverStylePicker({
  value,
  onChange,
}: HabitCardCoverStylePickerProps) {
  return (
    <div className="habit-cover-style-picker" role="radiogroup" aria-label="Card background style">
      {HABIT_CARD_COVER_STYLE_OPTIONS.map((option) => {
        const selected = value === option.style;
        return (
          <button
            key={option.style}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn("habit-cover-style-btn", selected && "selected")}
            onClick={() => onChange(option.style)}
          >
            <span
              className={cn(
                "habit-cover-style-thumb",
                `habit-cover-style-thumb--${option.style}`,
              )}
              aria-hidden
            />
            <span className="habit-cover-style-copy">
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
