"use client";

import Image from "next/image";
import {
  habitCoverImageSrc,
  type HabitCoverImageKey,
  type HabitCardCoverStyle,
} from "@/lib/content/habit-card-cover";
import { cn } from "@/lib/utils";

type HabitCardCoverProps = {
  style: HabitCardCoverStyle;
  coverImageKey: HabitCoverImageKey;
  className?: string;
};

export function HabitCardCover({
  style,
  coverImageKey,
  className,
}: HabitCardCoverProps) {
  if (style !== "image") return null;

  return (
    <div className={cn("habit-card-cover habit-card-cover--image", className)} aria-hidden>
      <Image
        src={habitCoverImageSrc(coverImageKey)}
        alt=""
        fill
        sizes="(max-width: 640px) 90vw, 320px"
        className="habit-card-cover-photo"
        draggable={false}
      />
      <div className="habit-card-cover-scrim habit-card-cover-scrim--photo" />
    </div>
  );
}
