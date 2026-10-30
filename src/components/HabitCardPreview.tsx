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
  const schedule = draft.scheduleLabel || "Every day";
  const coverStyle = draft.coverStyle;
  const showCorner = coverStyle === "corner";
  const showImage = coverStyle === "image";

  return (
    <article
      className={cn(
        "habit-card-preview habit-card habit-card-glass habit-card-v2",
        showImage && "habit-card-v2--cover-image",
      )}
      style={{ ["--habit" as string]: draft.color }}
      aria-label="Habit card preview"
    >
      {showImage ? (
        <HabitCardCover style="image" coverImageKey={draft.coverImageKey} />
      ) : null}
      {showCorner ? (
        <HabitCardCornerArt src={habitCardArtSrc(draft.cardArtKey)} />
      ) : null}

      <div className="habit-card-v2-body">
        <div className="habit-card-v2-head">
          <HabitIcon icon={draft.icon} color={draft.color} size="lg" className="habit-card-v2-icon" />
          <div className="habit-card-v2-head-meta">
            <p className="habit-card-streak">
              <Flame className="size-3.5" aria-hidden />
              <span>0 day streak</span>
            </p>
          </div>
        </div>

        <span className={`kind-chip habit-card-kind ${draft.behavior}`}>
          {behaviorLabel(draft.behavior)}
        </span>

        <div className="habit-card-main habit-card-v2-title-link">
          <h2>{title}</h2>
          <p className="habit-meta">{schedule}</p>
        </div>

        <div className="habit-week-track" aria-hidden>
          {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
            <span key={`${label}-${i}`} className={cn("habit-week-day", i === 3 && "on")}>
              <span className="habit-week-day-label">{label}</span>
              <span className="habit-week-day-dot">
                {i === 3 ? <Check className="size-2.5" strokeWidth={3} aria-hidden /> : null}
              </span>
            </span>
          ))}
        </div>

        <div className="habit-week-progress">
          <span className="habit-week-progress-label">1/7 this week</span>
          <div className="habit-week-bar" role="presentation">
            <span style={{ width: "14%" }} />
          </div>
        </div>

        <button type="button" className="check-btn habit-card-cta" disabled>
          ✓ Mark as done
        </button>
      </div>
    </article>
  );
}
