"use client";

import Link from "next/link";
import { GoalCard } from "@/components/GoalCard";
import { ReflectionCard } from "@/components/ReflectionCard";
import { RoutineTimeline } from "@/components/RoutineTimeline";
import { WeeklyReviewCard } from "@/components/WeeklyReviewCard";
import type { RoutineSlot } from "@/lib/content/routine";
import { parseDateKey } from "@/lib/dates";
import type {
  GoalWithHabits,
  HabitWithLogs,
  Reflection,
  RoutineSlotLink,
  WeeklyReview,
} from "@/lib/types";

type TodayClientProps = {
  dateKey: string;
  weekStart: string;
  slots: RoutineSlot[];
  checkedSlots: string[];
  links: RoutineSlotLink[];
  allHabits: HabitWithLogs[];
  goals: GoalWithHabits[];
  reflection: Reflection | null;
  weeklyReview: WeeklyReview | null;
  isSunday: boolean;
  rememberLine: string;
};

export function TodayClient({
  dateKey,
  weekStart,
  slots,
  checkedSlots,
  links,
  allHabits,
  goals,
  reflection,
  weeklyReview,
  isSunday,
  rememberLine,
}: TodayClientProps) {
  const prettyDate = parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="today">
      <section className="today-head animate-fade-up">
        <h1>Today</h1>
        <p className="today-date">{prettyDate}</p>
        <p className="remember-line">{rememberLine}</p>
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="panel-head">
          <h2>Your day, on purpose</h2>
          <Link href="/routine" className="panel-meta">
            Full routine →
          </Link>
        </div>
        <p className="grid-hint">
          One thing at a time. Tick a moment when you live it; tap a habit chip
          to check it in.
        </p>
        <RoutineTimeline
          dateKey={dateKey}
          slots={slots}
          initialChecked={checkedSlots}
          initialLinks={links}
          allHabits={allHabits}
        />
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="panel-head">
          <h2>Goals in motion</h2>
          <Link href="/goals" className="panel-meta">
            All goals →
          </Link>
        </div>
        {goals.length === 0 ? (
          <p className="grid-hint">
            No goals yet.{" "}
            <Link href="/goals" className="guide-cta">
              Name the person you&apos;re becoming →
            </Link>
          </p>
        ) : (
          <div className="goal-grid">
            {goals.slice(0, 2).map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} index={i} />
            ))}
          </div>
        )}
      </section>

      {(isSunday || weeklyReview) && (
        <section
          className="panel animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <div className="panel-head">
            <h2>Weekly review</h2>
          </div>
          <WeeklyReviewCard weekStart={weekStart} initial={weeklyReview} />
        </section>
      )}

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="panel-head">
          <h2>Evening review</h2>
          <span className="panel-meta">Three lines, no essays</span>
        </div>
        <ReflectionCard dateKey={dateKey} initial={reflection} />
      </section>
    </div>
  );
}
