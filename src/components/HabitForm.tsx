"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createHabit, seedHistoryFromStart, updateHabit } from "@/app/actions/habits";
import { PastDaysPicker } from "@/components/PastDaysPicker";
import { formatLongDate, todayKey } from "@/lib/dates";
import type {
  Habit,
  HabitBehaviorType,
  HabitInput,
} from "@/lib/types";
import {
  habitScheduleInput,
  scheduleFormFromHabit,
  validateScheduleForm,
  WEEKDAY_LABELS,
  type ScheduleFormState,
} from "@/lib/domain/schedule-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type HabitFormProps = {
  habit?: Habit;
  onDone?: () => void;
  compact?: boolean;
};

type Step = "details" | "history-ask" | "history-pick";

export function HabitForm({
  habit,
  onDone,
  compact,
}: HabitFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(habit?.name ?? "");
  const [behavior, setBehavior] = useState<HabitBehaviorType>(
    habit?.behavior_type ?? "build",
  );
  const [schedule, setSchedule] = useState<ScheduleFormState>(() =>
    scheduleFormFromHabit(habit),
  );
  const [startDate, setStartDate] = useState(habit?.start_date ?? todayKey());
  const [color, setColor] = useState(habit?.color ?? COLORS[0]);
  const [step, setStep] = useState<Step>("details");
  const [markedDays, setMarkedDays] = useState<Set<string>>(new Set());

  const needsHistoryOnboarding = !habit && startDate < todayKey();
  const isReduce = behavior !== "build";

  function resetForm() {
    setName("");
    setBehavior("build");
    setSchedule(scheduleFormFromHabit());
    setStartDate(todayKey());
    setColor(COLORS[0]);
    setStep("details");
    setMarkedDays(new Set());
  }

  function save(historyDates: string[] | null = null) {
    setError(null);
    const scheduleError = validateScheduleForm(schedule);
    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    const payload: HabitInput = {
      name,
      behavior_type: behavior,
      start_date: startDate,
      color,
      ...habitScheduleInput(schedule),
    };

    startTransition(async () => {
      const result = habit
        ? await updateHabit(habit.id, payload)
        : await createHabit(payload);

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (!habit && historyDates !== null) {
        await seedHistoryFromStart(
          result.data.id,
          behavior,
          startDate,
          historyDates,
        );
      }

      toast.success(habit ? "Habit updated." : `"${result.data.name}" added.`);
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
            {isReduce
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
                : isReduce
                  ? "No, stayed clean"
                  : "No, kept every day"}
            </Button>
            <Button
              type="button"
              variant={isReduce ? "destructive" : "secondary"}
              disabled={pending}
              onClick={() => setStep("history-pick")}
              className="w-full"
            >
              {isReduce ? "Yes, I slipped" : "Yes, I missed some"}
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
            {isReduce ? "Which days did you slip?" : "Which days did you miss?"}
          </h3>
        </div>

        <PastDaysPicker
          startDate={startDate}
          selected={markedDays}
          onChange={setMarkedDays}
          mode={isReduce ? "slip" : "miss"}
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
              ? "Save habit · all kept"
              : isReduce
                ? `Save habit · ${markedDays.size} slip${markedDays.size === 1 ? "" : "s"}`
                : `Save habit · ${markedDays.size} miss${markedDays.size === 1 ? "" : "es"}`}
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
          placeholder={behavior !== "build" ? "Quit smoking" : "Morning stretch"}
          required
          maxLength={80}
        />
      </div>

      <ToggleGroup
        type="single"
        value={behavior}
        onValueChange={(v) => v && setBehavior(v as HabitBehaviorType)}
        className="w-full justify-stretch rounded-lg bg-muted p-1"
        size="sm"
        spacing={0}
      >
        <ToggleGroupItem value="build" className="flex-1" aria-label="Grow a habit">
          Build
        </ToggleGroupItem>
        <ToggleGroupItem value="reduce" className="flex-1" aria-label="Reduce a habit">
          Reduce
        </ToggleGroupItem>
        <ToggleGroupItem value="avoid" className="flex-1" aria-label="Avoid a habit">
          Avoid
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        type="single"
        value={schedule.mode}
        onValueChange={(v) => v && setSchedule((s) => ({ ...s, mode: v as ScheduleFormState["mode"] }))}
        className="w-full justify-stretch rounded-lg bg-muted p-1"
        size="sm"
        spacing={0}
      >
        <ToggleGroupItem value="daily" className="flex-1" aria-label="Every day">
          Daily
        </ToggleGroupItem>
        <ToggleGroupItem value="weekly" className="flex-1" aria-label="Weekly">
          Weekly
        </ToggleGroupItem>
        <ToggleGroupItem value="custom" className="flex-1" aria-label="Custom schedule">
          Custom
        </ToggleGroupItem>
      </ToggleGroup>

      {schedule.mode === "weekly" ? (
        <div className="flex flex-col gap-2">
          <ToggleGroup
            type="single"
            value={schedule.weeklyVariant}
            onValueChange={(v) =>
              v &&
              setSchedule((s) => ({
                ...s,
                weeklyVariant: v as ScheduleFormState["weeklyVariant"],
              }))
            }
            className="w-full justify-stretch rounded-lg bg-muted p-1"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="once" className="flex-1">
              Once a week
            </ToggleGroupItem>
            <ToggleGroupItem value="times" className="flex-1">
              Times per week
            </ToggleGroupItem>
          </ToggleGroup>
          {schedule.weeklyVariant === "once" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="habit-weekly-day">On</Label>
              <select
                id="habit-weekly-day"
                className="habit-select"
                value={schedule.weeklyDay}
                onChange={(e) =>
                  setSchedule((s) => ({
                    ...s,
                    weeklyDay: Number(e.target.value),
                  }))
                }
              >
                {WEEKDAY_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="habit-times-week">Target</Label>
              <Input
                id="habit-times-week"
                type="number"
                min={1}
                max={7}
                value={schedule.timesPerWeek}
                onChange={(e) =>
                  setSchedule((s) => ({
                    ...s,
                    timesPerWeek: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>
          )}
        </div>
      ) : null}

      {schedule.mode === "custom" ? (
        <div className="flex flex-col gap-2">
          <ToggleGroup
            type="single"
            value={schedule.customVariant}
            onValueChange={(v) =>
              v &&
              setSchedule((s) => ({
                ...s,
                customVariant: v as ScheduleFormState["customVariant"],
              }))
            }
            className="w-full justify-stretch rounded-lg bg-muted p-1"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="weekdays" className="flex-1">
              On days
            </ToggleGroupItem>
            <ToggleGroupItem value="interval" className="flex-1">
              Every N days
            </ToggleGroupItem>
          </ToggleGroup>
          {schedule.customVariant === "weekdays" ? (
            <div className="schedule-weekdays" role="group" aria-label="Days of week">
              {WEEKDAY_LABELS.map((label, index) => {
                const on = schedule.weekdays.includes(index);
                return (
                  <button
                    key={label}
                    type="button"
                    className={`schedule-weekday ${on ? "on" : ""}`}
                    aria-pressed={on}
                    onClick={() =>
                      setSchedule((s) => ({
                        ...s,
                        weekdays: on
                          ? s.weekdays.filter((d) => d !== index)
                          : [...s.weekdays, index],
                      }))
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="habit-interval">Every</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="habit-interval"
                  type="number"
                  min={2}
                  max={365}
                  className="w-24"
                  value={schedule.intervalDays}
                  onChange={(e) =>
                    setSchedule((s) => ({
                      ...s,
                      intervalDays: Number(e.target.value) || 2,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-start">{behavior !== "build" ? "Start date" : "Started on"}</Label>
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
            {isReduce
              ? "Past start date — next we’ll ask if you relapsed since then. Days stay clean by default."
              : "Past start date — next we’ll ask if you missed any days. Days count as kept by default."}
          </AlertDescription>
        </Alert>
      ) : null}

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
              : "Add habit"}
      </Button>
    </form>
  );
}
