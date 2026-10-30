"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStaggerHabitGrid } from "@/components/animated/AnimatedHabitCard";
import { LayoutGrid, List, Plus, Search, Sprout } from "lucide-react";
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
import { AddHabitDialog } from "@/components/AddHabitDialog";
import {
  HabitsPageShellSkeleton,
  QueryErrorBanner,
} from "@/components/api/QueryLoading";
import { HabitCard } from "@/components/HabitCard";
import { useHabitsQuery } from "@/hooks/api/use-habits";
import { useDeleteHabitMutation, useReorderHabitsMutation } from "@/hooks/api/use-mutations";
import type { HabitWithLogs } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

type HabitsClientProps = {
  habits: HabitWithLogs[];
};

type Filter = "all" | "build" | "reduce" | "avoid";
type ViewMode = "grid" | "list";

function orderFromHabits(habits: HabitWithLogs[]) {
  return habits.map((h) => h.id);
}

function isSameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function HabitsClient({ habits: initialHabits }: HabitsClientProps) {
  const {
    data: habits = initialHabits,
    isLoading,
    isError,
    error,
  } = useHabitsQuery({ initialData: initialHabits });

  const reorderMutation = useReorderHabitsMutation();

  const [addOpen, setAddOpen] = useState(habits.length === 0);
  const [editHabit, setEditHabit] = useState<HabitWithLogs | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HabitWithLogs | null>(null);
  const deleteMutation = useDeleteHabitMutation(deleteTarget?.id ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(() => orderFromHabits(habits));
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((h) => {
      if (filter !== "all" && h.behavior_type !== filter) return false;
      if (q && !h.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, query]);

  const sortable = filter === "all" && !query.trim();

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

    reorderMutation.mutate(next, {
      onError: () => setOrder(previous),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(`“${name}” deleted.`);
        setDeleteTarget(null);
      },
    });
  }

  const cardActions = {
    onEdit: (habit: HabitWithLogs) => setEditHabit(habit),
    onDelete: (habit: HabitWithLogs) => setDeleteTarget(habit),
  };

  const gridRef = useRef<HTMLElement>(null);

  useStaggerHabitGrid(gridRef, ".habit-card", [filter, query, filtered.length, view]);

  const gridClass =
    view === "grid" ? "habit-grid habit-grid-dense" : "habit-list habit-list-dense";

  const grid = (
    <section
      ref={gridRef}
      className={gridClass}
      aria-label="Habits"
      data-view={view}
    >
      {filtered.length === 0 && habits.length > 0 ? (
        <p className="habits-empty-filter">No habits match your search.</p>
      ) : null}
      {filtered.map((habit, index) =>
        sortable ? (
          <HabitCard
            key={habit.id}
            habit={habit}
            index={index}
            layout={view}
            {...cardActions}
          />
        ) : (
          <HabitCard
            key={habit.id}
            habit={habit}
            index={index}
            sortable={false}
            layout={view}
            {...cardActions}
          />
        ),
      )}
    </section>
  );

  return (
    <div className="habits-page">
      {isError ? <QueryErrorBanner error={error} className="mb-3" /> : null}

      {isLoading && habits.length === 0 ? (
        <HabitsPageShellSkeleton />
      ) : (
        <>
      <header className="habits-page-head animate-fade-up">
        <div className="habits-page-title">
          <h1>Habits</h1>
          <p className="habits-page-count">
            {habits.length} active habit{habits.length === 1 ? "" : "s"}
            {sortable ? " · drag to reorder" : ""}
          </p>
        </div>
        <div className="habits-page-toolbar">
          <Button
            type="button"
            size="sm"
            className="habits-add-btn shrink-0"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Add habit
          </Button>
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v as Filter)}
            className="habits-filter-toggle"
            size="sm"
            spacing={0}
            aria-label="Filter habits"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="build">Build</ToggleGroupItem>
            <ToggleGroupItem value="reduce">Reduce</ToggleGroupItem>
            <ToggleGroupItem value="avoid">Avoid</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as ViewMode)}
            className="habits-view-toggle"
            size="sm"
            spacing={0}
            aria-label="View mode"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      {habits.length === 0 ? (
        <Empty className="habits-empty animate-fade-up">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sprout aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Add your first habit</EmptyTitle>
            <EmptyDescription>
              Track something you want to do more of, or cut back on.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" className="mt-3" onClick={() => setAddOpen(true)}>
            Add habit
          </Button>
        </Empty>
      ) : (
        <>
          <div className="habits-search-row animate-fade-up">
            <div className="habits-search relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search habits…"
                className="habits-search-input h-10 pl-9 text-sm"
                aria-label="Search habits"
              />
            </div>
          </div>

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
                    <HabitCard habit={activeHabit} overlay layout={view} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            grid
          )}
        </>
      )}

      <AddHabitDialog
        open={addOpen || editHabit !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
            setEditHabit(null);
          }
        }}
        habit={editHabit}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{deleteTarget?.name ?? "this habit"}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the habit and all check-in history. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  );
}
