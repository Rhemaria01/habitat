"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { reorderHabits } from "@/app/actions/habits";
import { HabitCard } from "@/components/HabitCard";
import { HabitForm } from "@/components/HabitForm";
import type { GoalWithHabits, HabitWithLogs } from "@/lib/types";

type HabitsClientProps = {
  habits: HabitWithLogs[];
  /** Only id + title are used (picker and filter). */
  goals: GoalWithHabits[];
  /** habit id -> goal ids it serves (for the goal filter). */
  goalIdsByHabit: Record<string, string[]>;
};

type Filter = "all" | "build" | "quit";

function orderFromHabits(habits: HabitWithLogs[]) {
  return habits.map((h) => h.id);
}

function isSameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function HabitsClient({
  habits,
  goals,
  goalIdsByHabit,
}: HabitsClientProps) {
  const [open, setOpen] = useState(habits.length === 0);
  const [filter, setFilter] = useState<Filter>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [order, setOrder] = useState(() => orderFromHabits(habits));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const serverOrder = orderFromHabits(habits);
  if (!isSameSet(order, serverOrder)) {
    setOrder(serverOrder);
  }

  const items = useMemo(() => {
    const map = new Map(habits.map((h) => [h.id, h]));
    return order
      .map((id) => map.get(id))
      .filter((h): h is HabitWithLogs => Boolean(h));
  }, [habits, order]);

  const filtered = useMemo(
    () =>
      items.filter(
        (h) =>
          (filter === "all" || h.kind === filter) &&
          (goalFilter === "all" ||
            (goalIdsByHabit[h.id] ?? []).includes(goalFilter)),
      ),
    [items, filter, goalFilter, goalIdsByHabit],
  );

  const sortable = filter === "all" && goalFilter === "all";

  const activeHabit = items.find((h) => h.id === activeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = order;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);

    startTransition(async () => {
      const result = await reorderHabits(next);
      if (!result.ok) setOrder(previous);
    });
  }

  const grid = (
    <section className="habit-grid" aria-label="Habits">
      {filtered.map((habit, index) =>
        sortable ? (
          <HabitCard key={habit.id} habit={habit} index={index} />
        ) : (
          <HabitCard
            key={habit.id}
            habit={habit}
            index={index}
            sortable={false}
          />
        ),
      )}
    </section>
  );

  return (
    <div className="habits-page">
      {habits.length === 0 ? (
        <section className="empty-nest animate-fade-up">
          <h1>Plant your first habit</h1>
          <p>
            Grow a good one, or start counting days free of an old one. Habits
            are the tasks your goals are made of.
          </p>
        </section>
      ) : (
        <>
          <div className="view-tabs" role="tablist" aria-label="Filter habits">
            <button
              type="button"
              className={`view-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`view-tab ${filter === "build" ? "active" : ""}`}
              onClick={() => setFilter("build")}
            >
              Good Habits
            </button>
            <button
              type="button"
              className={`view-tab ${filter === "quit" ? "active" : ""}`}
              onClick={() => setFilter("quit")}
            >
              To Quit
            </button>
          </div>

          {goals.length > 0 ? (
            <label className="field" style={{ marginBottom: "0.75rem" }}>
              <span>Filter by goal</span>
              <select
                value={goalFilter}
                onChange={(e) => setGoalFilter(e.target.value)}
              >
                <option value="all">All goals</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {sortable ? (
            <p className="grid-hint">Drag the ⋮⋮ handle to rearrange</p>
          ) : null}

          {sortable ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext items={order} strategy={rectSortingStrategy}>
                {grid}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeHabit ? (
                  <div className="drag-overlay">
                    <HabitCard habit={activeHabit} overlay />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            grid
          )}
        </>
      )}

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="panel-head">
          <h2>{open ? "New habit" : "Add a habit"}</h2>
          {habits.length > 0 ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide" : "Add"}
            </button>
          ) : null}
        </div>
        {open ? (
          <HabitForm goals={goals} onDone={() => setOpen(false)} />
        ) : null}
      </section>
    </div>
  );
}
