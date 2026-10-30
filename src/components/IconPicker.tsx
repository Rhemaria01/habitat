"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HABIT_EMOJIS, isHabitEmoji } from "@/lib/habit-emojis";
import {
  DEFAULT_HABIT_ICON,
  HABIT_ICON_IDS,
  habitIconComponent,
  isHabitIconId,
  type HabitIconId,
} from "@/lib/habit-icons";

type IconPickerProps = {
  value: string | null;
  onChange: (symbol: string) => void;
  color?: string;
};

type PickerTab = "icons" | "emojis";

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const [tab, setTab] = useState<PickerTab>(() =>
    value && isHabitEmoji(value) ? "emojis" : "icons",
  );

  return (
    <div className="symbol-picker">
      <div className="symbol-picker-tabs" role="tablist" aria-label="Symbol type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "icons"}
          className={cn("symbol-picker-tab", tab === "icons" && "active")}
          onClick={() => setTab("icons")}
        >
          Icons
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "emojis"}
          className={cn("symbol-picker-tab", tab === "emojis" && "active")}
          onClick={() => setTab("emojis")}
        >
          Emojis
        </button>
      </div>

      {tab === "icons" ? (
        <div className="icon-picker" role="group" aria-label="Habit icons">
          {HABIT_ICON_IDS.map((id) => {
            const Icon = habitIconComponent(id);
            const pressed = isHabitIconId(value)
              ? value === id
              : !value && id === DEFAULT_HABIT_ICON;
            return (
              <button
                key={id}
                type="button"
                className={cn("icon-picker-btn", pressed && "selected")}
                aria-pressed={pressed}
                aria-label={id}
                onClick={() => onChange(id)}
                style={
                  pressed && color
                    ? {
                        background: `color-mix(in srgb, ${color} 28%, transparent)`,
                        borderColor: color,
                        color,
                      }
                    : undefined
                }
              >
                <Icon className="size-5" strokeWidth={2} aria-hidden />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="emoji-picker" role="group" aria-label="Habit emojis">
          {HABIT_EMOJIS.map((emoji) => {
            const pressed = isHabitEmoji(value) && value === emoji;
            return (
              <button
                key={emoji}
                type="button"
                className={cn("emoji-picker-btn", pressed && "selected")}
                aria-pressed={pressed}
                aria-label={`Emoji ${emoji}`}
                onClick={() => onChange(emoji)}
                style={
                  pressed && color
                    ? {
                        background: `color-mix(in srgb, ${color} 22%, transparent)`,
                        borderColor: color,
                      }
                    : undefined
                }
              >
                <span aria-hidden>{emoji}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type { HabitIconId };
