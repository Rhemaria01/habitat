import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoal } from "@/app/actions/goals";
import { listHabits } from "@/app/actions/habits";
import { AppShell } from "@/components/AppShell";
import { GoalDetailClient } from "@/components/GoalDetailClient";

export const dynamic = "force-dynamic";

type GoalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;

  let goal = null;
  let habits: Awaited<ReturnType<typeof listHabits>> = [];
  try {
    [goal, habits] = await Promise.all([getGoal(id), listHabits()]);
  } catch {
    return (
      <AppShell>
        <section className="panel">
          <p className="form-error">Could not load this goal.</p>
          <Link href="/goals" className="back-link">
            ← All goals
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!goal) notFound();

  const linkedIds = new Set(goal.habits.map((h) => h.id));

  return (
    <AppShell>
      <GoalDetailClient
        goal={goal}
        availableHabits={habits.filter((h) => !linkedIds.has(h.id))}
      />
    </AppShell>
  );
}
