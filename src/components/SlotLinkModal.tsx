"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHabit } from "@/app/actions/habits";
import { linkHabitToSlot } from "@/app/actions/routine";
import type { RoutineSlot } from "@/lib/content/routine";
import { todayKey } from "@/lib/dates";
import type { HabitKind, HabitWithLogs } from "@/lib/types";

type SlotLinkModalProps = {
  slot: RoutineSlot;
  allHabits: HabitWithLogs[];
  /** Ids of habits already linked to this slot (disabled in the list). */
  linkedIds: Set<string>;
  onClose: () => void;
  onLinked: (slotKey: string, habit: HabitWithLogs) => void;
};

const NEW_COLOR = "#4FD1A5";
const NEW_QUIT_COLOR = "#FF7A8A";

export function SlotLinkModal({
  slot,
  allHabits,
  linkedIds,
  onClose,
  onLinked,
}: SlotLinkModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<HabitKind>("build");

  function linkExisting(habit: HabitWithLogs) {
    setError(null);
    startTransition(async () => {
      const result = await linkHabitToSlot(slot.key, habit.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onLinked(slot.key, habit);
      router.refresh();
      onClose();
    });
  }

  function createAndLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createHabit({
        name: newName,
        kind: newKind,
        start_date: todayKey(),
        color: newKind === "build" ? NEW_COLOR : NEW_QUIT_COLOR,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const link = await linkHabitToSlot(slot.key, result.data.id);
      if (!link.ok) {
        setError(link.error);
        return;
      }
      onLinked(slot.key, { ...result.data, logs: [] });
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Associate a habit with ${slot.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>Associate with “{slot.title}”</h3>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="kind-toggle" role="group" aria-label="Modal mode">
          <button
            type="button"
            className={mode === "pick" ? "active" : ""}
            onClick={() => setMode("pick")}
          >
            Existing habit
          </button>
          <button
            type="button"
            className={mode === "create" ? "active quit" : ""}
            onClick={() => setMode("create")}
          >
            New habit
          </button>
        </div>

        {mode === "pick" ? (
          allHabits.length === 0 ? (
            <p className="history-picker-hint" style={{ marginTop: "0.9rem" }}>
              No habits yet — create one from the “new habit” tab.
            </p>
          ) : (
            <ul className="link-pick" style={{ marginTop: "0.9rem" }}>
              {allHabits.map((habit) => {
                const already = linkedIds.has(habit.id);
                return (
                  <li key={habit.id}>
                    <button
                      type="button"
                      disabled={already || pending}
                      onClick={() => linkExisting(habit)}
                    >
                      <span
                        className="pick-dot"
                        style={{ background: habit.color }}
                        aria-hidden
                      />
                      {habit.name}
                      <span className={`kind-chip ${habit.kind}`}>
                        {habit.kind === "build" ? "Good" : "To quit"}
                      </span>
                      {already ? <small>Linked</small> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <form className="habit-form" onSubmit={createAndLink} style={{ marginTop: "0.9rem" }}>
            <label className="field">
              <span>Habit name</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={newKind === "build" ? "Walk 10,000 steps" : "Scroll in bed"}
                required
                maxLength={80}
              />
            </label>
            <div className="kind-toggle" role="group" aria-label="Habit type">
              <button
                type="button"
                className={newKind === "build" ? "active" : ""}
                onClick={() => setNewKind("build")}
              >
                Good habit
              </button>
              <button
                type="button"
                className={newKind === "quit" ? "active quit" : ""}
                onClick={() => setNewKind("quit")}
              >
                Bad habit
              </button>
            </div>
            <button type="submit" className="primary-btn" disabled={pending}>
              {pending ? "Linking…" : "Create & associate"}
            </button>
          </form>
        )}

        {error ? <p className="form-error" style={{ marginTop: "0.75rem" }}>{error}</p> : null}
      </div>
    </div>
  );
}
