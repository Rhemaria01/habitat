"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { GoalCard } from "@/components/GoalCard";
import { GoalForm } from "@/components/GoalForm";
import type { GoalWithHabits } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type GoalsClientProps = {
  goals: GoalWithHabits[];
};

export function GoalsClient({ goals }: GoalsClientProps) {
  const [open, setOpen] = useState(goals.length === 0);

  return (
    <div className="goals-page">
      <section className="today-head animate-fade-up">
        <h1>Goals</h1>
        <p className="today-date">
          Outcomes you want, and the person you&apos;re becoming to get there.
        </p>
      </section>

      {goals.length === 0 && !open ? (
        <Empty className="animate-fade-up">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Target aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No goals yet</EmptyTitle>
            <EmptyDescription>
              A goal is a direction plus an identity. “I am a healthy person”
              beats “I must lose weight” — habits are the votes that prove it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="goal-grid">
          {goals.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i} />
          ))}
        </div>
      )}

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="panel-head">
          <h2>{open ? "New goal" : "Add a goal"}</h2>
          {goals.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide" : "Add"}
            </Button>
          ) : null}
        </div>
        {open ? <GoalForm onDone={() => setOpen(false)} /> : null}
      </section>
    </div>
  );
}
