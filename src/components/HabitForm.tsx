"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PastDaysPicker } from "@/components/PastDaysPicker";
import {
  useCreateHabitMutation,
  useSeedHistoryMutation,
  useUpdateHabitMutation,
} from "@/hooks/api/use-mutations";
import { formatLongDate, LOCALE, parseDateKey, todayKey } from "@/lib/dates";
import type {
  Habit,
  HabitBehaviorType,
  HabitInput,
} from "@/lib/types";
import {
  habitScheduleInput,
  scheduleFormFromHabit,
  schedulePreviewLabel,
  validateScheduleForm,
  WEEKDAY_LABELS,
  type ScheduleFormState,
} from "@/lib/domain/schedule-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Ban,
  CalendarDays,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { IconPicker } from "@/components/IconPicker";
import { HabitCardArtPicker } from "@/components/HabitCardArtPicker";
import { HabitCardCoverStylePicker } from "@/components/HabitCardCoverStylePicker";
import { HabitCoverImagePicker } from "@/components/HabitCoverImagePicker";
import {
  DEFAULT_HABIT_CARD_ART_KEY,
  habitCardArtKeyForForm,
  type HabitCardArtKey,
} from "@/lib/content/habit-card-art";
import {
  DEFAULT_CREATE_HABIT_COVER_STYLE,
  DEFAULT_HABIT_COVER_IMAGE_KEY,
  habitCardCoverKeyForForm,
  habitCoverImageKeyForForm,
  type HabitCardCoverStyle,
  type HabitCardPreviewDraft,
  type HabitCoverImageKey,
} from "@/lib/content/habit-card-cover";
import { normalizeHabitSymbol } from "@/lib/habit-symbol";

import { HABIT_PICKER_COLORS } from "@/lib/habitat-colors";

const COLORS = [...HABIT_PICKER_COLORS];

type HabitFormProps = {
  habit?: Habit;
  onDone?: () => void;
  onCancel?: () => void;
  compact?: boolean;
  formId?: string;
  hideSubmit?: boolean;
  onDraftChange?: (draft: HabitCardPreviewDraft) => void;
};

type Step = "details" | "history-ask" | "history-pick";

export function HabitForm({
  habit,
  onDone,
  onCancel,
  compact,
  formId,
  hideSubmit,
  onDraftChange,
}: HabitFormProps) {
  const router = useRouter();
  const createMutation = useCreateHabitMutation();
  const updateMutation = useUpdateHabitMutation(habit?.id ?? "");
  const seedMutation = useSeedHistoryMutation();
  const pending =
    createMutation.isPending || updateMutation.isPending || seedMutation.isPending;
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
  const [icon, setIcon] = useState<string | null>(habit?.icon ?? null);
  const [cardArtKey, setCardArtKey] = useState<HabitCardArtKey>(() =>
    habitCardArtKeyForForm(habit),
  );
  const [coverStyle, setCoverStyle] = useState<HabitCardCoverStyle>(() =>
    habit ? habitCardCoverKeyForForm(habit) : DEFAULT_CREATE_HABIT_COVER_STYLE,
  );
  const [coverImageKey, setCoverImageKey] = useState<HabitCoverImageKey>(() =>
    habit ? habitCoverImageKeyForForm(habit) : DEFAULT_HABIT_COVER_IMAGE_KEY,
  );
  const [step, setStep] = useState<Step>("details");
  const [markedDays, setMarkedDays] = useState<Set<string>>(new Set());

  const needsHistoryOnboarding = !habit && startDate < todayKey();
  const isReduce = behavior !== "build";

  useEffect(() => {
    if (!onDraftChange) return;
    onDraftChange({
      name,
      behavior,
      color,
      icon,
      cardArtKey,
      coverStyle,
      coverImageKey,
      scheduleLabel: schedulePreviewLabel(schedule),
    });
  }, [
    name,
    behavior,
    color,
    icon,
    cardArtKey,
    coverStyle,
    coverImageKey,
    schedule,
    onDraftChange,
  ]);

  function resetForm() {
    setName("");
    setBehavior("build");
    setSchedule(scheduleFormFromHabit());
    setStartDate(todayKey());
    setColor(COLORS[0]);
    setIcon(null);
    setCardArtKey(DEFAULT_HABIT_CARD_ART_KEY);
    setCoverStyle(
      habit ? habitCardCoverKeyForForm(habit) : DEFAULT_CREATE_HABIT_COVER_STYLE,
    );
    setCoverImageKey(
      habit ? habitCoverImageKeyForForm(habit) : DEFAULT_HABIT_COVER_IMAGE_KEY,
    );
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
      icon: normalizeHabitSymbol(icon),
      card_art_key: cardArtKey,
      card_cover_style: coverStyle,
      card_cover_image_key: coverImageKey,
      ...habitScheduleInput(schedule),
    };

    const finish = (habitName: string) => {
      toast.success(habit ? "Habit updated." : `"${habitName}" added.`);
      resetForm();
      onDone?.();
      if (!onDone) router.push("/habits");
    };

    if (habit) {
      updateMutation.mutate(payload, {
        onSuccess: (data) => finish(data.name),
        onError: (err) => setError(err.userMessage),
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (created) => {
        if (historyDates !== null) {
          seedMutation.mutate(
            {
              habitId: created.id,
              behavior,
              startDate,
              dates: historyDates,
            },
            { onSuccess: () => finish(created.name) },
          );
        } else {
          finish(created.name);
        }
      },
      onError: (err) => setError(err.userMessage),
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
      id={formId}
      onSubmit={onDetailsSubmit}
      className={`habit-form ${compact ? "compact habit-form-modal" : ""}`}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-name">Name</Label>
        <Input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={behavior !== "build" ? "Quit smoking" : "e.g. Morning stretch"}
          required
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <ToggleGroup
          type="single"
          value={behavior}
          onValueChange={(v) => v && setBehavior(v as HabitBehaviorType)}
          className="habit-segment-toggle habit-type-toggle w-full justify-stretch"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="build" className="flex-1 gap-1.5" aria-label="Grow a habit">
            <TrendingUp className="size-3.5 shrink-0" aria-hidden />
            Build
          </ToggleGroupItem>
          <ToggleGroupItem value="reduce" className="flex-1 gap-1.5" aria-label="Reduce a habit">
            <TrendingDown className="size-3.5 shrink-0 text-[var(--reduce-accent)]" aria-hidden />
            Reduce
          </ToggleGroupItem>
          <ToggleGroupItem value="avoid" className="flex-1 gap-1.5" aria-label="Avoid a habit">
            <Ban className="size-3.5 shrink-0 text-[var(--avoid-accent)]" aria-hidden />
            Avoid
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Repeat</Label>
        <ToggleGroup
          type="single"
          value={schedule.mode}
          onValueChange={(v) => v && setSchedule((s) => ({ ...s, mode: v as ScheduleFormState["mode"] }))}
          className="habit-segment-toggle w-full justify-stretch"
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
      </div>

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
            className="w-full justify-stretch"
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
            className="w-full justify-stretch"
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
        <Label htmlFor="habit-start">{behavior !== "build" ? "Start date" : "Start date"}</Label>
        <div className="habit-date-field">
          <CalendarDays className="habit-date-icon size-4" aria-hidden />
          <span className="habit-date-display" aria-hidden>
            {parseDateKey(startDate).toLocaleDateString(LOCALE)}
          </span>
          <Input
            id="habit-start"
            type="date"
            className="habit-date-input"
            value={startDate}
            max={todayKey()}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
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
        <Label>Icon or emoji</Label>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Card look</Label>
        <HabitCardCoverStylePicker value={coverStyle} onChange={setCoverStyle} />
      </div>

      {coverStyle === "image" ? (
        <div className="flex flex-col gap-2">
          <Label>Cover photo</Label>
          <p className="text-xs text-muted-foreground">
            Background only — title, streak, and buttons stay in the same layout.
          </p>
          <HabitCoverImagePicker value={coverImageKey} onChange={setCoverImageKey} />
        </div>
      ) : null}

      {coverStyle !== "image" ? (
        <div className="flex flex-col gap-2">
          <Label>Corner illustration</Label>
          <HabitCardArtPicker value={cardArtKey} onChange={setCardArtKey} />
        </div>
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

      {compact && onCancel ? (
        <div className="habit-modal-footer">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Spinner className="size-4" aria-hidden />
                Saving…
              </>
            ) : needsHistoryOnboarding ? (
              "Continue"
            ) : habit ? (
              "Save changes"
            ) : (
              "Add habit"
            )}
          </Button>
        </div>
      ) : hideSubmit ? null : (
        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Saving…"
            : habit
              ? "Save changes"
              : needsHistoryOnboarding
                ? "Continue"
                : "Add habit"}
        </Button>
      )}
    </form>
  );
}
