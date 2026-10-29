import Link from "next/link";
import { computeGoalStats } from "@/lib/streaks";
import type { GoalWithHabits } from "@/lib/types";
import { HaloCard } from "@/components/ui/halo-card";
import { Badge } from "@/components/ui/badge";

type GoalCardProps = {
  goal: GoalWithHabits;
  index?: number;
};

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

export function ProgressRing({ percent, size = "regular" }: { percent: number; size?: "regular" | "small" }) {
  const offset = RING_C - (Math.min(100, Math.max(0, percent)) / 100) * RING_C;
  const dim = size === "small" ? 2.4 : 3;
  return (
    <div
      className="ring"
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

export function GoalCard({ goal, index = 0 }: GoalCardProps) {
  const stats = computeGoalStats(goal.habits);

  return (
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
}
