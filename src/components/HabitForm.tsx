"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createHabit, updateHabit } from "@/app/actions/habits";
import { PastDaysPicker } from "@/components/PastDaysPicker";
import { formatLongDate, todayKey } from "@/lib/dates";
import type {
  Goal,
  Habit,
  HabitFrequency,
  HabitInput,
  HabitKind,
} from "@/lib/types";

const COLORS = [
  "#4FD1A5",
  "#FF7A8A",
  "#F5B942",
  "#A78BFA",
  "#6FB3E8",
  "#F2789F",
];

type HabitFormProps = {
  habit?: Habit;
  /** Goals offered in the "serves a goal" picker (create only). */
  goals?: Goal[];
  /** Preselect this goal when adding from a goal's detail page. */
  defaultGoalId?: string;
  onDone?: () => void;
  compact?: boolean;
};

type Step = "details" | "history-ask" | "history-pick";

export function HabitForm({
  habit,
  goals = [],
  defaultGoalId,
  onDone,
  compact,
}: HabitFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(habit?.name ?? "");
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? "build");
  const [frequency, setFrequency] = useState<HabitFrequency>(
    habit?.frequency ?? "daily",
  );
  const [startDate, setStartDate] = useState(habit?.start_date ?? todayKey());
  const [color, setColor] = useState(habit?.color ?? COLORS[0]);
  const [stackAfter, setStackAfter] = useState(habit?.stack_after ?? "");
  const [twoMinute, setTwoMinute] = useState(
    habit?.two_minute_version ?? "",
  );
  const [identityProof, setIdentityProof] = useState(
    habit?.identity_proof ?? "",
  );
  const [goalId, setGoalId] = useState(defaultGoalId ?? "");
  const [step, setStep] = useState<Step>("details");
  const [markedDays, setMarkedDays] = useState<Set<string>>(new Set());

  const needsHistoryOnboarding = !habit && startDate < todayKey();
  const isQuit = kind === "quit";
  const showGoalPicker = !habit && goals.length > 0;

  function resetForm() {
    setName("");
    setKind("build");
    setFrequency("daily");
    setStartDate(todayKey());
    setColor(COLORS[0]);
    setStackAfter("");
    setTwoMinute("");
    setIdentityProof("");
    setGoalId(defaultGoalId ?? "");
    setStep("details");
    setMarkedDays(new Set());
  }

  function save(historyDates: string[] | null = null) {
    setError(null);
    const payload: HabitInput = {
      name,
      kind,
      start_date: startDate,
      color,
      frequency,
      stack_after: stackAfter.trim() || null,
      two_minute_version: twoMinute.trim() || null,
      identity_proof: identityProof.trim() || null,
    };

    if (!habit) {
      if (goalId) payload.goal_id = goalId;
      if (historyDates !== null) {
        if (kind === "quit") {
          if (historyDates.length > 0) payload.relapse_dates = historyDates;
        } else {
          payload.missed_dates = historyDates;
        }
      }
    }

    startTransition(async () => {
      const result = habit
        ? await updateHabit(habit.id, payload)
        : await createHabit(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      resetForm();
      onDone?.();
      router.refresh();
    });
  }

  function onDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsHistoryOnboarding) {
      setMarkedDays(new Set());
      setStep("history-ask");
      return;
    }

    save();
  }

  if (step === "history-ask") {
    return (
      <div className={`habit-form history-step ${compact ? "compact" : ""}`}>
        <button
          type="button"
          className="ghost-btn history-back"
          onClick={() => setStep("details")}
        >
          ← Back
        </button>

        <div className="history-ask">
          <h3>Since {formatLongDate(startDate)}</h3>
          <p>
            {isQuit
              ? "We’ll count every day as kept until today. Have you relapsed in between?"
              : "We’ll count every day as kept until today. Have you missed any days?"}
          </p>

          <div className="history-ask-actions">
            <button
              type="button"
              className="primary-btn"
              disabled={pending}
              onClick={() => save([])}
            >
              {pending
                ? "Saving…"
                : isQuit
                  ? "No, stayed clean"
                  : "No, kept every day"}
            </button>
            <button
              type="button"
              className={`secondary-btn ${isQuit ? "quit" : ""}`}
              disabled={pending}
              onClick={() => setStep("history-pick")}
            >
              {isQuit ? "Yes, I slipped" : "Yes, I missed some"}
            </button>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    );
  }

  if (step === "history-pick") {
    return (
      <div className={`habit-form history-step ${compact ? "compact" : ""}`}>
        <button
          type="button"
          className="ghost-btn history-back"
          onClick={() => setStep("history-ask")}
        >
          ← Back
        </button>

        <div className="history-ask">
          <h3>
            {isQuit ? "Which days did you slip?" : "Which days did you miss?"}
          </h3>
        </div>

        <PastDaysPicker
          startDate={startDate}
          selected={markedDays}
          onChange={setMarkedDays}
          mode={isQuit ? "slip" : "miss"}
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="button"
          className="primary-btn"
          disabled={pending}
          onClick={() => save([...markedDays].sort())}
        >
          {pending
            ? "Saving…"
            : markedDays.size === 0
              ? "Plant habit · all kept"
              : isQuit
                ? `Plant habit · ${markedDays.size} slip${markedDays.size === 1 ? "" : "s"}`
                : `Plant habit · ${markedDays.size} miss${markedDays.size === 1 ? "" : "es"}`}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onDetailsSubmit}
      className={`habit-form ${compact ? "compact" : ""}`}
    >
      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "quit" ? "Quit smoking" : "Morning stretch"}
          required
          maxLength={80}
        />
      </label>

      <div className="kind-toggle" role="group" aria-label="Habit type">
        <button
          type="button"
          className={kind === "build" ? "active" : ""}
          onClick={() => setKind("build")}
        >
          Grow a habit
        </button>
        <button
          type="button"
          className={kind === "quit" ? "active quit" : ""}
          onClick={() => setKind("quit")}
        >
          Quit a habit
        </button>
      </div>

      <div className="kind-toggle" role="group" aria-label="Frequency">
        <button
          type="button"
          className={frequency === "daily" ? "active" : ""}
          onClick={() => setFrequency("daily")}
        >
          Every day
        </button>
        <button
          type="button"
          className={frequency === "weekly" ? "active" : ""}
          onClick={() => setFrequency("weekly")}
        >
          Weekly
        </button>
      </div>

      <label className="field">
        <span>{kind === "quit" ? "Quit date" : "Started on"}</span>
        <input
          type="date"
          value={startDate}
          max={todayKey()}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </label>

      {needsHistoryOnboarding ? (
        <p className={`form-note ${isQuit ? "quit" : ""}`}>
          {isQuit
            ? "Past quit date — next we’ll ask if you relapsed since then. Days stay clean by default."
            : "Past start date — next we’ll ask if you missed any days. Days count as kept by default."}
        </p>
      ) : null}

      <details className="form-more">
        <summary>The fine-tuning (optional)</summary>

        <label className="field">
          <span>Habit stack — &ldquo;After I ___, I will ___&rdquo;</span>
          <input
            value={stackAfter}
            onChange={(e) => setStackAfter(e.target.value)}
            placeholder="After I pour my morning coffee…"
            maxLength={200}
          />
        </label>

        <label className="field">
          <span>2-minute version — the tiny entry point</span>
          <input
            value={twoMinute}
            onChange={(e) => setTwoMinute(e.target.value)}
            placeholder="Put on my running shoes"
            maxLength={200}
          />
        </label>

        <label className="field">
          <span>Identity proof — the vote this casts</span>
          <input
            value={identityProof}
            onChange={(e) => setIdentityProof(e.target.value)}
            placeholder="Proof I am a healthy person"
            maxLength={200}
          />
        </label>

        {showGoalPicker ? (
          <label className="field">
            <span>Serves a goal</span>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              <option value="">No goal yet</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </details>

      <div className="field">
        <span>Color</span>
        <div className="color-row">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${color === c ? "selected" : ""}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-btn" disabled={pending}>
        {pending
          ? "Saving…"
          : habit
            ? "Save changes"
            : needsHistoryOnboarding
              ? "Continue"
              : "Plant habit"}
      </button>
    </form>
  );
}
