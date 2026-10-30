"use client";

import Image from "next/image";
import {
  habitCardCoverObjectArtSrc,
  habitCardCoverObjectMeshClass,
  habitCardCoverPhotoSrc,
  type HabitCardCoverStyle,
} from "@/lib/content/habit-card-cover";
import type { HabitCardArtKey } from "@/lib/content/habit-card-art";
import { HabitIcon } from "@/components/HabitIcon";
import { cn } from "@/lib/utils";

type HabitCardCoverProps = {
  style: HabitCardCoverStyle;
  artKey: HabitCardArtKey;
  color: string;
  icon: string | null;
  className?: string;
};

export function HabitCardCover({
  style,
  artKey,
  color,
  icon,
  className,
}: HabitCardCoverProps) {
  if (style === "corner") return null;

  if (style === "image") {
    return (
      <div className={cn("habit-card-cover habit-card-cover--image", className)} aria-hidden>
        <Image
          src={habitCardCoverPhotoSrc(artKey)}
          alt=""
          fill
          sizes="(max-width: 640px) 90vw, 320px"
          className="habit-card-cover-photo"
          draggable={false}
          priority={false}
        />
        <div className="habit-card-cover-scrim" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "habit-card-cover habit-card-cover--object",
        habitCardCoverObjectMeshClass(artKey),
        className,
      )}
      style={{ ["--habit" as string]: color }}
      aria-hidden
    >
      <div className="habit-card-cover-mesh" />
      <div className="habit-card-cover-object-wrap">
        {icon ? (
          <HabitIcon icon={icon} color={color} size="lg" className="habit-card-cover-icon" />
        ) : (
          <Image
            src={habitCardCoverObjectArtSrc(artKey)}
            alt=""
            width={120}
            height={120}
            className="habit-card-cover-object-art"
            draggable={false}
          />
        )}
      </div>
      <div className="habit-card-cover-scrim habit-card-cover-scrim--object" />
    </div>
  );
}
