"use client";

import { Check, Flame } from "lucide-react";
import { HabitCardCornerArt } from "@/components/HabitCardCornerArt";
import { HabitCardCover } from "@/components/HabitCardCover";
import { HabitIcon } from "@/components/HabitIcon";
import { habitCardArtSrc } from "@/lib/content/habit-card-art";
import type { HabitCardPreviewDraft } from "@/lib/content/habit-card-cover";
import { cn } from "@/lib/utils";

type HabitCardPreviewProps = {
  draft: HabitCardPreviewDraft;
};

function behaviorLabel(behavior: HabitCardPreviewDraft["behavior"]): string {
  return behavior.charAt(0).toUpperCase() + behavior.slice(1);
}

export function HabitCardPreview({ draft }: HabitCardPreviewProps) {
  const title = draft.name.trim() || "Your habit name";
  const isCover = draft.coverStyle !== "corner";
  const schedule = draft.scheduleLabel || "Every day";

  return (
    <article
      className={cn(
        "habit-card-preview",
        isCover && `habit-card-preview--${draft.coverStyle}`,
      )}
      style={{ ["--habit" as string]: draft.color }}
      aria-label="Habit card preview"
    >
      <HabitCardCover
        style={draft.coverStyle}
        artKey={draft.cardArtKey}
        color={draft.color}
        icon={draft.icon}
      />
      {!isCover ? (
        <HabitCardCornerArt src={habitCardArtSrc(draft.cardArtKey)} />
      ) : null}

      {isCover ? (
        <div className="habit-card-preview-overlay-copy">
          <span className={`kind-chip habit-card-kind ${draft.behavior}`}>
            {behaviorLabel(draft.behavior)}
          </span>
          <h3>{title}</h3>
          <p>{schedule}</p>
        </div>
      ) : (
        <>
          <div className="habit-card-preview-head">
            <HabitIcon icon={draft.icon} color={draft.color} size="lg" />
            <p className="habit-card-streak">
              <Flame className="size-3.5" aria-hidden />
              <span>0 day streak</span>
            </p>
          </div>
          <span className={`kind-chip habit-card-kind ${draft.behavior}`}>
            {behaviorLabel(draft.behavior)}
          </span>
          <div className="habit-card-preview-title">
            <h3>{title}</h3>
            <p className="habit-meta">{schedule}</p>
          </div>
          <div className="habit-week-track habit-card-preview-week" aria-hidden>
            {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
              <span key={`${label}-${i}`} className="habit-week-day">
                <span className="habit-week-day-label">{label}</span>
                <span className="habit-week-day-dot">
                  {i === 3 ? <Check className="size-2.5" strokeWidth={3} /> : null}
                </span>
              </span>
            ))}
          </div>
          <button type="button" className="check-btn habit-card-cta" disabled>
            ✓ Mark as done
          </button>
        </>
      )}
    </article>
  );
}
