"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteHabitAudit,
  saveHabitAudit,
  saveReview,
} from "@/app/actions/reviews";
import type { HabitAudit, Review } from "@/lib/types";
import { weekStartKey, todayKey } from "@/lib/dates";
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

type ReviewClientProps = {
  weekly: Review | null;
  audits: HabitAudit[];
  history: Review[];
};

export function ReviewClient({ weekly: initialWeekly, audits: initialAudits, history }: ReviewClientProps) {
  const weekStart = weekStartKey(todayKey());
  const [weekly, setWeekly] = useState(initialWeekly);
  const [wentWell, setWentWell] = useState(String(weekly?.responses.went_well ?? ""));
  const [friction, setFriction] = useState(String(weekly?.responses.friction ?? ""));
  const [adjustment, setAdjustment] = useState(weekly?.adjustment_note ?? "");
  const [audits, setAudits] = useState(initialAudits);
  const [behavior, setBehavior] = useState("");
  const [classification, setClassification] = useState<HabitAudit["classification"]>("neutral");
  const [pending, startTransition] = useTransition();

  function saveWeekly() {
    startTransition(async () => {
      const r = await saveReview("weekly", weekStart, { went_well: wentWell, friction }, adjustment);
      if (r.ok) {
        setWeekly(r.data);
        toast.success("Weekly review saved");
      } else toast.error(r.error);
    });
  }

  function addAudit() {
    if (!behavior.trim()) return;
    startTransition(async () => {
      const r = await saveHabitAudit(null, behavior, classification, "");
      if (r.ok) {
        setAudits((a) => [...a, r.data]);
        setBehavior("");
      } else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-8">
      <section className="panel max-w-xl space-y-3">
        <h2>Weekly review</h2>
        <p className="text-xs text-muted-foreground">Week of {weekStart}</p>
        <div>
          <Label>What went well</Label>
          <Textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
        </div>
        <div>
          <Label>What got in the way</Label>
          <Textarea value={friction} onChange={(e) => setFriction(e.target.value)} />
        </div>
        <div>
          <Label>One small adjustment for next week</Label>
          <Input value={adjustment} onChange={(e) => setAdjustment(e.target.value)} />
        </div>
        <Button type="button" disabled={pending} onClick={saveWeekly}>
          Save weekly review
        </Button>
      </section>

      <section className="panel max-w-xl space-y-3">
        <h2>Habit scorecard</h2>
        <p className="text-sm text-muted-foreground">
          List recurring behaviors and classify them for yourself — no judgment.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Behavior you repeat"
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
          />
          <Select
            value={classification}
            onValueChange={(v) => setClassification(v as HabitAudit["classification"])}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="helpful">Helpful</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="unhelpful">Unhelpful</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={addAudit}>
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {audits.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>
                {a.behavior}{" "}
                <span className="text-muted-foreground">({a.classification})</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteHabitAudit(a.id);
                    if (r.ok) setAudits((list) => list.filter((x) => x.id !== a.id));
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {history.length ? (
        <section className="panel">
          <h2>Review history</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {history.map((r) => (
              <li key={r.id}>
                {r.review_type} · {r.period_start}
                {r.adjustment_note ? ` — ${r.adjustment_note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
