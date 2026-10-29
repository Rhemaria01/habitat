"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Archive, Link2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { archiveGoal, linkHabitToGoal } from "@/app/actions/goals";
import { GoalForm } from "@/components/GoalForm";
import { HabitForm } from "@/components/HabitForm";
import { computeGoalStats } from "@/lib/streaks";
import type { GoalWithHabits, HabitWithLogs } from "@/lib/types";
import { HaloCard } from "@/components/ui/halo-card";
import { Badge } from "@/components/ui/badge";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GoalCardProps = {
  goal: GoalWithHabits;
  index?: number;
  /** All habits — used to offer “attach habit” from the card menu. */
  allHabits?: HabitWithLogs[];
};

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

export function ProgressRing({
  percent,
  size = "regular",
}: {
  percent: number;
  size?: "regular" | "small";
}) {
  const offset = RING_C - (Math.min(100, Math.max(0, percent)) / 100) * RING_C;
  const dim = size === "small" ? 2.4 : 3;
  return (
    <div
      className="progress-ring"
      style={{ width: `${dim}rem`, height: `${dim}rem` }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={dim * 16} height={dim * 16}>
        <circle className="ring-bg" cx="24" cy="24" r={RING_R} />
        <circle
          className="ring-val"
          cx="24"
          cy="24"
          r={RING_R}
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="ring-num"
        style={{ fontSize: size === "small" ? "0.6rem" : "0.68rem" }}
      >
        {percent}%
      </span>
    </div>
  );
}

export function GoalCard({ goal, index = 0, allHabits = [] }: GoalCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const stats = computeGoalStats(goal.habits);

  const linkedIds = useMemo(
    () => new Set(goal.habits.map((h) => h.id)),
    [goal.habits],
  );

  const attachable = useMemo(
    () => allHabits.filter((h) => !linkedIds.has(h.id)),
    [allHabits, linkedIds],
  );

  function onAttach(habitId: string) {
    startTransition(async () => {
      const result = await linkHabitToGoal(goal.id, habitId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const name = allHabits.find((h) => h.id === habitId)?.name;
      toast.success(name ? `“${name}” attached to this goal.` : "Habit attached.");
      router.refresh();
    });
  }

  function onArchive() {
    startTransition(async () => {
      const result = await archiveGoal(goal.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`“${goal.title}” archived.`);
      setArchiveOpen(false);
      router.refresh();
    });
  }

  const cardBody = (
    <HaloCard
      padding="none"
      className="goal-halo animate-fade-up"
      aria-label={goal.title}
      style={{
        animationDelay: `${index * 60}ms`,
        ["--goal" as string]: goal.color,
      }}
    >
      <Link href={`/goals/${goal.id}`} className="goal-card">
        <div>
          <h2>{goal.title}</h2>
          <p className="goal-identity">“{goal.identity_statement}”</p>
        </div>
        <div className="goal-foot">
          {stats.total === 0 ? (
            <Badge variant="outline">No tasks yet</Badge>
          ) : (
            <Badge variant="secondary">
              {stats.kept}/{stats.total} tasks this week · {stats.votes} votes
            </Badge>
          )}
          <ProgressRing percent={stats.percent} />
        </div>
      </Link>
    </HaloCard>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="goal-halo-wrap">{cardBody}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem
            onSelect={() => setEditOpen(true)}
            disabled={pending}
          >
            <Pencil aria-hidden />
            Edit goal
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={pending}>
              <Link2 aria-hidden />
              Attach habit
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-64 w-56">
              {attachable.length === 0 ? (
                <ContextMenuItem disabled>No habits to attach</ContextMenuItem>
              ) : (
                attachable.map((habit) => (
                  <ContextMenuItem
                    key={habit.id}
                    onSelect={() => onAttach(habit.id)}
                    disabled={pending}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: habit.color }}
                      aria-hidden
                    />
                    {habit.name}
                  </ContextMenuItem>
                ))
              )}
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={() => setAddTaskOpen(true)}
                disabled={pending}
              >
                <Plus aria-hidden />
                New task for this goal
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onSelect={() => setArchiveOpen(true)}
            disabled={pending}
          >
            <Archive aria-hidden />
            Archive goal
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={goal}
            compact
            onDone={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <HabitForm
            goals={[goal]}
            defaultGoalId={goal.id}
            compact
            onDone={() => {
              setAddTaskOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{goal.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Its habits stay in your list — only the goal is hidden from your
              boards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={onArchive} disabled={pending}>
              {pending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
