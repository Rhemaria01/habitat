"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
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
import type { HabitWithLogs } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

type HabitsClientProps = {
  habits: HabitWithLogs[];
};

type Filter = "all" | "build" | "reduce" | "avoid";

function orderFromHabits(habits: HabitWithLogs[]) {
  return habits.map((h) => h.id);
}

function isSameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function HabitsClient({ habits }: HabitsClientProps) {
  const [open, setOpen] = useState(habits.length === 0);
  const [filter, setFilter] = useState<Filter>("all");
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
        (h) => filter === "all" || h.behavior_type === filter,
      ),
    [items, filter],
  );

  const sortable = filter === "all";

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
      if (!result.ok) {
        setOrder(previous);
        toast.error(result.error);
      }
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
        <Empty className="animate-fade-up">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sprout aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Add your first habit</EmptyTitle>
            <EmptyDescription>
              Track something you want to do more of, or something you want to
              cut back on.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v as Filter)}
            className="w-full justify-stretch rounded-lg bg-muted p-1"
            size="sm"
            spacing={0}
            aria-label="Filter habits"
          >
            <ToggleGroupItem value="all" className="flex-1">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="build" className="flex-1">
              Build
            </ToggleGroupItem>
            <ToggleGroupItem value="reduce" className="flex-1">
              Reduce
            </ToggleGroupItem>
            <ToggleGroupItem value="avoid" className="flex-1">
              Avoid
            </ToggleGroupItem>
          </ToggleGroup>

          {sortable ? (
            <p className="grid-hint">Drag the handle to rearrange</p>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide" : "Quick add"}
            </Button>
          ) : null}
        </div>
        {open ? <HabitForm onDone={() => setOpen(false)} /> : null}
      </section>
    </div>
  );
}
