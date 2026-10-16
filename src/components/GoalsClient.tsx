"use client";

import { useState } from "react";
import { GoalCard } from "@/components/GoalCard";
import { GoalForm } from "@/components/GoalForm";
import type { GoalWithHabits } from "@/lib/types";

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
        <section className="empty-nest animate-fade-up">
          <h1>No goals yet</h1>
          <p>
            A goal is a direction plus an identity. &ldquo;I am a healthy
            person&rdquo; beats &ldquo;I must lose weight&rdquo; — habits are
            the votes that prove it.
          </p>
        </section>
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
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide" : "Add"}
            </button>
          ) : null}
        </div>
        {open ? <GoalForm onDone={() => setOpen(false)} /> : null}
      </section>
    </div>
  );
}
