"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createHabit } from "@/app/actions/habits";
import { todayKey } from "@/lib/dates";
import type { Goal, HabitBehaviorType, HabitInput, ScheduleKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#5E6AD2", "#4FD1A5", "#F0B429", "#A78BFA", "#6FB3E8", "#F4576B"];

const STEPS = [
  "Intent",
  "Cue",
  "Motivation",
  "Friction",
  "Reward",
  "Schedule",
] as const;

type HabitWizardProps = {
  goals?: Pick<Goal, "id" | "title">[];
  systems?: { id: string; name: string }[];
};

export function HabitWizard({ goals = [], systems = [] }: HabitWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [behavior, setBehavior] = useState<HabitBehaviorType>("build");
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [systemId, setSystemId] = useState<string>("");
  const [goalId, setGoalId] = useState<string>("");
  const [minimum, setMinimum] = useState("");
  const [standard, setStandard] = useState("");
  const [stackAfter, setStackAfter] = useState("");
  const [cueTime, setCueTime] = useState("");
  const [cuePlace, setCuePlace] = useState("");
  const [meaning, setMeaning] = useState("");
  const [appeal, setAppeal] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [environment, setEnvironment] = useState("");
  const [reward, setReward] = useState("");
  const [recovery, setRecovery] = useState("");
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>("daily");
  const [timeWindow, setTimeWindow] = useState<string>("");

  function buildInput(): HabitInput {
    return {
      name: standard.trim() || name.trim(),
      behavior_type: behavior,
      start_date: todayKey(),
      color,
      system_id: systemId || null,
      goal_id: goalId || undefined,
      minimum_version: minimum.trim() || null,
      standard_version: standard.trim() || name.trim(),
      stack_after: stackAfter.trim() || null,
      cue_type: stackAfter ? "stack" : cueTime || cuePlace ? "time_place" : "none",
      cue_time: cueTime.trim() || null,
      cue_place: cuePlace.trim() || null,
      motivation_meaning: meaning.trim() || null,
      motivation_appeal: appeal.trim() || null,
      friction_obstacle: obstacle.trim() || null,
      friction_environment: environment.trim() || null,
      reward_personal: reward.trim() || null,
      recovery_plan: recovery.trim() || null,
      schedule_kind: scheduleKind,
      time_window: (timeWindow || null) as HabitInput["time_window"],
    };
  }

  function submit() {
    if (!name.trim() && !standard.trim()) {
      toast.error("Add a habit name.");
      return;
    }
    startTransition(async () => {
      const result = await createHabit(buildInput());
      if (result.ok) {
        toast.success("Habit created");
        router.push(`/habits/${result.data.id}`);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="panel max-w-xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-md px-2 py-1 text-xs ${i === step ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setStep(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Habit name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={behavior} onValueChange={(v) => setBehavior(v as HabitBehaviorType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="build">Build</SelectItem>
                <SelectItem value="reduce">Reduce</SelectItem>
                <SelectItem value="avoid">Avoid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {systems.length ? (
            <div>
              <Label>System (optional)</Label>
              <Select value={systemId || "__none__"} onValueChange={(v) => setSystemId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {systems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {goals.length ? (
            <div>
              <Label>Link to goal (optional)</Label>
              <Select value={goalId || "__none__"} onValueChange={(v) => setGoalId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <Label>Minimum version</Label>
            <Input
              placeholder="Smallest start on a hard day"
              value={minimum}
              onChange={(e) => setMinimum(e.target.value)}
            />
          </div>
          <div>
            <Label>Standard version</Label>
            <Input
              placeholder="Normal day target"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <Label>After I… (habit stack)</Label>
            <Input value={stackAfter} onChange={(e) => setStackAfter(e.target.value)} />
          </div>
          <div>
            <Label>Time</Label>
            <Input value={cueTime} onChange={(e) => setCueTime(e.target.value)} />
          </div>
          <div>
            <Label>Place</Label>
            <Input value={cuePlace} onChange={(e) => setCuePlace(e.target.value)} />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <Label>Why it matters to you</Label>
            <Textarea value={meaning} onChange={(e) => setMeaning(e.target.value)} />
          </div>
          <div>
            <Label>What could make it more appealing</Label>
            <Textarea value={appeal} onChange={(e) => setAppeal(e.target.value)} />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <Label>Likely obstacle</Label>
            <Textarea value={obstacle} onChange={(e) => setObstacle(e.target.value)} />
          </div>
          <div>
            <Label>Environment preparation</Label>
            <Textarea value={environment} onChange={(e) => setEnvironment(e.target.value)} />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div>
            <Label>How completion will feel rewarding</Label>
            <Textarea value={reward} onChange={(e) => setReward(e.target.value)} />
          </div>
          <div>
            <Label>Recovery after a miss</Label>
            <Textarea value={recovery} onChange={(e) => setRecovery(e.target.value)} />
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <div>
            <Label>Schedule</Label>
            <Select value={scheduleKind} onValueChange={(v) => setScheduleKind(v as ScheduleKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="days_per_week">Flexible days per week</SelectItem>
                <SelectItem value="custom">Custom days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time window</Label>
            <Select value={timeWindow || "__none__"} onValueChange={(v) => setTimeWindow(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any time</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="size-8 rounded-full border-2"
                style={{
                  background: c,
                  borderColor: color === c ? "var(--foreground)" : "transparent",
                }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button type="button" disabled={pending} onClick={submit}>
            {pending ? "Saving…" : "Create habit"}
          </Button>
        )}
      </div>
    </div>
  );
}
