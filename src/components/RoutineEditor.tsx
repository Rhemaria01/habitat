"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSlot,
  deleteSlot,
  reorderSlots,
  updateSlot,
} from "@/app/actions/routine";
import type {
  DayType,
  RoutineSlot,
  RoutineSlotInput,
} from "@/lib/content/routine";

type RoutineEditorProps = {
  dayType: DayType;
  /** Slots for the current day type, ordered as stored in the DB. */
  slots: RoutineSlot[];
};

function blankDraft(dayType: DayType): RoutineSlotInput {
  return { time: "", title: "", doText: "", dontText: "", dayType };
}

export function RoutineEditor({ dayType, slots }: RoutineEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoutineSlotInput>(() =>
    blankDraft(dayType),
  );

  const orderedIds = slots
    .map((s) => s.id)
    .filter((id): id is string => Boolean(id));
  const canReorder = orderedIds.length === slots.length && slots.length > 1;

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= slots.length) return;
    const ids = [...orderedIds];
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setError(null);
    startTransition(async () => {
      const result = await reorderSlots(ids);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createSlot({ ...draft, dayType });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(blankDraft(dayType));
      router.refresh();
    });
  }

  return (
    <div className="routine-editor">
      {slots.length === 0 ? (
        <p className="grid-hint">
          No moments in this arc yet — add your first one below.
        </p>
      ) : (
        <ul className="slot-edit-list">
          {slots.map((slot, index) => (
            <SlotEditRow
              key={slot.id ?? slot.key}
              slot={slot}
              canUp={canReorder && index > 0}
              canDown={canReorder && index < slots.length - 1}
              onMove={(dir) => move(index, dir)}
              onError={setError}
              busy={pending}
            />
          ))}
        </ul>
      )}

      <form className="slot-add" onSubmit={onAdd}>
        <h3 className="slot-add-title">Add a moment</h3>
        <div className="slot-add-grid">
          <label className="field">
            <span>Time or label</span>
            <input
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              placeholder="7:00 AM"
              maxLength={40}
              required
            />
          </label>
          <label className="field">
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Morning pages"
              maxLength={80}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>Do — what to lean into</span>
          <textarea
            value={draft.doText}
            onChange={(e) => setDraft({ ...draft, doText: e.target.value })}
            placeholder="One clear, kind instruction for this moment."
            rows={2}
            maxLength={400}
          />
        </label>
        <label className="field">
          <span>Don&apos;t — what to step away from</span>
          <textarea
            value={draft.dontText}
            onChange={(e) => setDraft({ ...draft, dontText: e.target.value })}
            placeholder="The trap you are trying to avoid here."
            rows={2}
            maxLength={400}
          />
        </label>
        <button type="submit" className="primary-btn" disabled={pending}>
          {pending ? "Adding…" : "Add moment"}
        </button>
      </form>

      {error ? (
        <p className="form-error" style={{ marginTop: "0.75rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SlotEditRowProps = {
  slot: RoutineSlot;
  canUp: boolean;
  canDown: boolean;
  busy: boolean;
  onMove: (dir: -1 | 1) => void;
  onError: (message: string) => void;
};

function SlotEditRow({
  slot,
  canUp,
  canDown,
  busy,
  onMove,
  onError,
}: SlotEditRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [time, setTime] = useState(slot.time);
  const [title, setTitle] = useState(slot.title);
  const [doText, setDoText] = useState(slot.doText);
  const [dontText, setDontText] = useState(slot.dontText);
  const [saved, setSaved] = useState(false);

  const dirty =
    time !== slot.time ||
    title !== slot.title ||
    doText !== slot.doText ||
    dontText !== slot.dontText;

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!slot.id) return;
    setSaved(false);
    startTransition(async () => {
      const result = await updateSlot(slot.id as string, {
        time,
        title,
        doText,
        dontText,
        dayType: slot.dayType,
      });
      if (!result.ok) {
        onError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function onDelete() {
    if (!slot.id) return;
    if (!confirm(`Remove "${slot.title}" from this routine?`)) return;
    startTransition(async () => {
      const result = await deleteSlot(slot.id as string);
      if (!result.ok) onError(result.error);
      else router.refresh();
    });
  }

  return (
    <li className="slot-edit">
      <div className="slot-edit-move">
        <button
          type="button"
          className="move-btn"
          aria-label="Move up"
          disabled={!canUp || busy || pending}
          onClick={() => onMove(-1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="move-btn"
          aria-label="Move down"
          disabled={!canDown || busy || pending}
          onClick={() => onMove(1)}
        >
          ↓
        </button>
      </div>

      <form className="slot-edit-form" onSubmit={onSave}>
        <div className="slot-add-grid">
          <label className="field">
            <span>Time or label</span>
            <input
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setSaved(false);
              }}
              maxLength={40}
              required
            />
          </label>
          <label className="field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
              maxLength={80}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>Do</span>
          <textarea
            value={doText}
            onChange={(e) => {
              setDoText(e.target.value);
              setSaved(false);
            }}
            rows={2}
            maxLength={400}
          />
        </label>
        <label className="field">
          <span>Don&apos;t</span>
          <textarea
            value={dontText}
            onChange={(e) => {
              setDontText(e.target.value);
              setSaved(false);
            }}
            rows={2}
            maxLength={400}
          />
        </label>

        <div className="slot-edit-actions">
          <button
            type="submit"
            className="primary-btn small"
            disabled={!dirty || pending}
          >
            {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
          <button
            type="button"
            className="danger-btn small"
            disabled={pending}
            onClick={onDelete}
          >
            Remove
          </button>
        </div>
      </form>
    </li>
  );
}
