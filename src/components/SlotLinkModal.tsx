"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createHabit } from "@/app/actions/habits";
import { linkHabitToSlot } from "@/app/actions/routine";
import type { RoutineSlot } from "@/lib/content/routine";
import { todayKey } from "@/lib/dates";
import type { HabitKind, HabitWithLogs } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

type SlotLinkModalProps = {
  slot: RoutineSlot;
  allHabits: HabitWithLogs[];
  /** Ids of habits already linked to this slot (disabled in the list). */
  linkedIds: Set<string>;
  onClose: () => void;
  onLinked: (slotKey: string, habit: HabitWithLogs) => void;
};

const NEW_COLOR = "#5E6AD2";
const NEW_QUIT_COLOR = "#F4576B";

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
        toast.error(result.error);
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
        toast.error(result.error);
        return;
      }
      const link = await linkHabitToSlot(slot.key, result.data.id);
      if (!link.ok) {
        setError(link.error);
        toast.error(link.error);
        return;
      }
      onLinked(slot.key, { ...result.data, logs: [] });
      router.refresh();
      onClose();
      toast.success(`“${result.data.name}” created and associated.`);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Associate with “{slot.title}”</DialogTitle>
        </DialogHeader>

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as "pick" | "create")}
          className="w-full justify-stretch rounded-lg bg-muted p-1"
          size="sm"
        >
          <ToggleGroupItem value="pick" className="flex-1" aria-label="Pick existing">
            Existing habit
          </ToggleGroupItem>
          <ToggleGroupItem value="create" className="flex-1" aria-label="Create new">
            New habit
          </ToggleGroupItem>
        </ToggleGroup>

        {mode === "pick" ? (
          allHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No habits yet — create one from the “new habit” tab.
            </p>
          ) : (
            <Command>
              <CommandInput placeholder="Search habits…" />
              <CommandList>
                <CommandEmpty>No habit matches.</CommandEmpty>
                <CommandGroup>
                  {allHabits.map((habit) => {
                    const already = linkedIds.has(habit.id);
                    return (
                      <CommandItem
                        key={habit.id}
                        value={habit.name}
                        disabled={already || pending}
                        onSelect={() => linkExisting(habit)}
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: habit.color }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{habit.name}</span>
                        {already ? (
                          <Badge variant="secondary">Linked</Badge>
                        ) : (
                          <Badge variant={habit.kind === "build" ? "default" : "destructive"}>
                            {habit.kind === "build" ? "Good" : "To quit"}
                          </Badge>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          )
        ) : (
          <form className="flex flex-col gap-4" onSubmit={createAndLink}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-new-habit">Habit name</Label>
              <Input
                id="slot-new-habit"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={newKind === "build" ? "Walk 10,000 steps" : "Scroll in bed"}
                required
                maxLength={80}
              />
            </div>
            <ToggleGroup
              type="single"
              value={newKind}
              onValueChange={(v) => v && setNewKind(v as HabitKind)}
              className="w-full justify-stretch rounded-lg bg-muted p-1"
              size="sm"
            >
              <ToggleGroupItem value="build" className="flex-1" aria-label="Good habit">
                Good habit
              </ToggleGroupItem>
              <ToggleGroupItem value="quit" className="flex-1" aria-label="Bad habit">
                Bad habit
              </ToggleGroupItem>
            </ToggleGroup>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Linking…" : "Create & associate"}
            </Button>
          </form>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
