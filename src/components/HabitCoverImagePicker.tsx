"use client";

import Image from "next/image";
import {
  HABIT_COVER_IMAGE_OPTIONS,
  type HabitCoverImageKey,
} from "@/lib/content/habit-card-cover";
import { cn } from "@/lib/utils";

type HabitCoverImagePickerProps = {
  value: HabitCoverImageKey;
  onChange: (key: HabitCoverImageKey) => void;
};

export function HabitCoverImagePicker({ value, onChange }: HabitCoverImagePickerProps) {
  return (
    <div className="habit-cover-image-picker" role="radiogroup" aria-label="Cover photo">
      {HABIT_COVER_IMAGE_OPTIONS.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            className={cn("habit-cover-image-btn", selected && "selected")}
            onClick={() => onChange(option.key)}
          >
            <span className="habit-cover-image-thumb">
              <Image
                src={option.src}
                alt=""
                fill
                sizes="80px"
                className="habit-cover-image-thumb-img"
                draggable={false}
              />
            </span>
            <span className="habit-cover-image-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
