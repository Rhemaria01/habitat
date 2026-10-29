"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

const COLORS = [
  "#4FD1A5",
  "#5E6AD2",
  "#F0B429",
  "#A78BFA",
  "#6FB3E8",
  "#F4576B",
];

const NO_GOAL = "__none__";

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
  const [goalId, setGoalId] = useState(defaultGoalId ?? NO_GOAL);
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
    setGoalId(NO_GOAL);
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
      if (goalId && goalId !== NO_GOAL) payload.goal_id = goalId;
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
        toast.error(result.error);
        return;
      }

      toast.success(habit ? "Habit updated." : `“${result.data.name}” planted.`);
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start -ml-2"
          onClick={() => setStep("details")}
        >
          ← Back
        </Button>

        <div className="history-ask">
          <h3>Since {formatLongDate(startDate)}</h3>
          <p>
            {isQuit
              ? "We’ll count every day as kept until today. Have you relapsed in between?"
              : "We’ll count every day as kept until today. Have you missed any days?"}
          </p>

          <div className="history-ask-actions">
            <Button
              type="button"
              disabled={pending}
              onClick={() => save([])}
              className="w-full"
            >
              {pending
                ? "Saving…"
                : isQuit
                  ? "No, stayed clean"
                  : "No, kept every day"}
            </Button>
            <Button
              type="button"
              variant={isQuit ? "destructive" : "secondary"}
              disabled={pending}
              onClick={() => setStep("history-pick")}
              className="w-full"
            >
              {isQuit ? "Yes, I slipped" : "Yes, I missed some"}
            </Button>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    );
  }

  if (step === "history-pick") {
    return (
      <div className={`habit-form history-step ${compact ? "compact" : ""}`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start -ml-2"
          onClick={() => setStep("history-ask")}
        >
          ← Back
        </Button>

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

        <Button
          type="button"
          disabled={pending}
          onClick={() => save([...markedDays].sort())}
          className="w-full"
        >
          {pending
            ? "Saving…"
            : markedDays.size === 0
              ? "Plant habit · all kept"
              : isQuit
                ? `Plant habit · ${markedDays.size} slip${markedDays.size === 1 ? "" : "s"}`
                : `Plant habit · ${markedDays.size} miss${markedDays.size === 1 ? "" : "es"}`}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onDetailsSubmit}
      className={`habit-form ${compact ? "compact" : ""}`}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-name">Name</Label>
        <Input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "quit" ? "Quit smoking" : "Morning stretch"}
          required
          maxLength={80}
        />
      </div>

      <ToggleGroup
        type="single"
        value={kind}
        onValueChange={(v) => v && setKind(v as HabitKind)}
        className="w-full justify-stretch rounded-lg bg-muted p-1"
        size="sm"
      >
        <ToggleGroupItem value="build" className="flex-1" aria-label="Grow a habit">
          Grow a habit
        </ToggleGroupItem>
        <ToggleGroupItem value="quit" className="flex-1" aria-label="Quit a habit">
          Quit a habit
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        type="single"
        value={frequency}
        onValueChange={(v) => v && setFrequency(v as HabitFrequency)}
        className="w-full justify-stretch rounded-lg bg-muted p-1"
        size="sm"
      >
        <ToggleGroupItem value="daily" className="flex-1" aria-label="Every day">
          Every day
        </ToggleGroupItem>
        <ToggleGroupItem value="weekly" className="flex-1" aria-label="Weekly">
          Weekly
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-start">{kind === "quit" ? "Quit date" : "Started on"}</Label>
        <Input
          id="habit-start"
          type="date"
          value={startDate}
          max={todayKey()}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      {needsHistoryOnboarding ? (
        <Alert>
          <Lightbulb className="size-4" aria-hidden />
          <AlertDescription>
            {isQuit
              ? "Past quit date — next we’ll ask if you relapsed since then. Days stay clean by default."
              : "Past start date — next we’ll ask if you missed any days. Days count as kept by default."}
          </AlertDescription>
        </Alert>
      ) : null}

      <details className="form-more">
        <summary>The fine-tuning (optional)</summary>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="habit-stack">
              Habit stack — “After I ___, I will ___”
            </Label>
            <Input
              id="habit-stack"
              value={stackAfter}
              onChange={(e) => setStackAfter(e.target.value)}
              placeholder="After I pour my morning coffee…"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="habit-two-minute">2-minute version — the tiny entry point</Label>
            <Input
              id="habit-two-minute"
              value={twoMinute}
              onChange={(e) => setTwoMinute(e.target.value)}
              placeholder="Put on my running shoes"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="habit-identity">Identity proof — the vote this casts</Label>
            <Input
              id="habit-identity"
              value={identityProof}
              onChange={(e) => setIdentityProof(e.target.value)}
              placeholder="Proof I am a healthy person"
              maxLength={200}
            />
          </div>

          {showGoalPicker ? (
            <div className="flex flex-col gap-2">
              <Label>Serves a goal</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No goal yet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GOAL}>No goal yet</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </details>

      <div className="flex flex-col gap-2">
        <Label>Color</Label>
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

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Saving…"
          : habit
            ? "Save changes"
            : needsHistoryOnboarding
              ? "Continue"
              : "Plant habit"}
      </Button>
    </form>
  );
}
