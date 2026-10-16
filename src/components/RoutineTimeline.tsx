"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSlotCheck, unlinkHabitFromSlot } from "@/app/actions/routine";
import { toggleHabitDay } from "@/app/actions/habits";
import { SlotLinkModal } from "@/components/SlotLinkModal";
import type { RoutineSlot } from "@/lib/content/routine";
import type { HabitWithLogs, RoutineSlotLink } from "@/lib/types";

type RoutineTimelineProps = {
  dateKey: string;
  slots: RoutineSlot[];
  initialChecked: string[];
  initialLinks: RoutineSlotLink[];
  /** All active habits, for the associate-habit modal. */
  allHabits: HabitWithLogs[];
  /** Show the "+ associate" affordance per slot. */
  allowLinking?: boolean;
};

export function RoutineTimeline({
  dateKey,
  slots,
  initialChecked,
  initialLinks,
  allHabits,
  allowLinking = true,
}: RoutineTimelineProps) {
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(initialChecked),
  );
  const [linksBySlot, setLinksBySlot] = useState<
    Map<string, RoutineSlotLink[]>
  >(() => {
    const map = new Map<string, RoutineSlotLink[]>();
    for (const link of initialLinks) {
      const list = map.get(link.slot_key) ?? [];
      list.push(link);
      map.set(link.slot_key, list);
    }
    return map;
  });
  const [modalSlot, setModalSlot] = useState<RoutineSlot | null>(null);
  const [, startTransition] = useTransition();

  const linkedIds = useMemo(() => {
    const set = new Set<string>();
    for (const list of linksBySlot.values()) {
      for (const link of list) set.add(link.habit.id);
    }
    return set;
  }, [linksBySlot]);

  function onToggleSlot(slotKey: string) {
    const next = new Set(checked);
    if (next.has(slotKey)) next.delete(slotKey);
    else next.add(slotKey);
    setChecked(next);

    startTransition(async () => {
      const result = await toggleSlotCheck(slotKey, dateKey);
      if (result.ok) router.refresh();
    });
  }

  function onToggleHabit(link: RoutineSlotLink) {
    const currentlyLogged = link.logged;
    startTransition(async () => {
      setLinksBySlot((current) => {
        const map = new Map(current);
        for (const [slotKey, list] of map.entries()) {
          const idx = list.findIndex((l) => l.habit.id === link.habit.id);
          if (idx < 0) continue;
          const nextList = [...list];
          nextList[idx] = {
            ...nextList[idx],
            logged: !currentlyLogged,
          };
          map.set(slotKey, nextList);
        }
        return map;
      });

      const result = await toggleHabitDay(
        link.habit.id,
        link.habit.kind,
        dateKey,
        currentlyLogged,
      );
      if (result.ok) router.refresh();
    });
  }

  function onUnlink(link: RoutineSlotLink) {
    startTransition(async () => {
      setLinksBySlot((current) => {
        const map = new Map(current);
        const list = map.get(link.slot_key);
        if (list) {
          map.set(
            link.slot_key,
            list.filter((l) => l.habit.id !== link.habit.id),
          );
        }
        return map;
      });

      const result = await unlinkHabitFromSlot(link.slot_key, link.habit.id);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="timeline">
      {slots.map((slot, index) => {
        const isDone = checked.has(slot.key);
        const links = linksBySlot.get(slot.key) ?? [];

        return (
          <article
            key={slot.key}
            className={`slot animate-fade-up ${isDone ? "done" : ""}`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="slot-rail">
              <button
                type="button"
                className={`slot-check ${isDone ? "on" : ""}`}
                aria-pressed={isDone}
                aria-label={`Mark "${slot.title}" ${isDone ? "not done" : "done"}`}
                onClick={() => onToggleSlot(slot.key)}
              >
                ✓
              </button>
              <span className="slot-time">{slot.time}</span>
            </div>

            <div className="slot-body">
              <h3 className="slot-title">{slot.title}</h3>
              <p className="slot-do">{slot.doText}</p>
              <p className="slot-dont">{slot.dontText}</p>

              {links.length > 0 || allowLinking ? (
                <div className="slot-links">
                  {links.map((link) => {
                    return (
                      <button
                        key={link.habit.id}
                        type="button"
                        className={`habit-chip ${link.habit.kind} ${link.logged ? "done" : ""}`}
                        onClick={() => onToggleHabit(link)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onUnlink(link);
                        }}
                        title={`${link.habit.name} — tap to ${
                          link.logged ? "undo" : "check today"
                        }`}
                      >
                        <span className="dot" aria-hidden />
                        {link.habit.name}
                        {link.habit.kind === "quit" && link.logged
                          ? " · Slipped"
                          : ""}
                      </button>
                    );
                  })}
                  {allowLinking ? (
                    <button
                      type="button"
                      className="chip-add"
                      onClick={() => setModalSlot(slot)}
                    >
                      + Habit
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}

      {modalSlot ? (
        <SlotLinkModal
          slot={modalSlot}
          allHabits={allHabits}
          linkedIds={linkedIds}
          onClose={() => setModalSlot(null)}
          onLinked={(slotKey, habit) => {
            setLinksBySlot((current) => {
              const map = new Map(current);
              const list = map.get(slotKey) ?? [];
              if (list.some((l) => l.habit.id === habit.id)) return map;
              map.set(slotKey, [
                ...list,
                { slot_key: slotKey, habit, logged: false },
              ]);
              return map;
            });
          }}
        />
      ) : null}
    </div>
  );
}
