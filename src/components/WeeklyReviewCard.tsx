"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWeeklyReview } from "@/app/actions/reflections";
import { WEEKLY_REVIEW_QUESTION } from "@/lib/content/atomic-habits";
import type { WeeklyReview } from "@/lib/types";

type WeeklyReviewCardProps = {
  weekStart: string;
  initial: WeeklyReview | null;
};

export function WeeklyReviewCard({ weekStart, initial }: WeeklyReviewCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [movedCloser, setMovedCloser] = useState<boolean | null>(
    initial ? initial.moved_closer : null,
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (movedCloser === null) {
      setError("Pick an answer first — be honest.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveWeeklyReview(weekStart, movedCloser, notes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="review-ask">{WEEKLY_REVIEW_QUESTION}</p>

      <div className="review-choice" role="group" aria-label="Did you move closer?">
        <button
          type="button"
          className={`yes ${movedCloser === true ? "active" : ""}`}
          onClick={() => setMovedCloser(true)}
        >
          Moved closer
        </button>
        <button
          type="button"
          className={`no ${movedCloser === false ? "active" : ""}`}
          onClick={() => setMovedCloser(false)}
        >
          Just busy
        </button>
      </div>

      <label className="field">
        <span>One line for next week</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder="What deserves more of me next week?"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-btn" disabled={pending}>
        {pending
          ? "Saving…"
          : initial
            ? "Update weekly review"
            : "Save weekly review"}
      </button>
    </form>
  );
}
