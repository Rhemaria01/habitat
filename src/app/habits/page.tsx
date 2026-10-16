import { listGoals } from "@/app/actions/goals";
import { listHabits } from "@/app/actions/habits";
import { AppShell } from "@/components/AppShell";
import { HabitsClient } from "@/components/HabitsClient";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  let error: string | null = null;
  let habits: Awaited<ReturnType<typeof listHabits>> = [];
  let goals: Awaited<ReturnType<typeof listGoals>> = [];

  try {
    [habits, goals] = await Promise.all([listHabits(), listGoals()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load habits.";
  }

  if (error) {
    return (
      <AppShell>
        <section className="panel">
          <h2>Couldn&apos;t load habits</h2>
          <p className="form-error" style={{ marginTop: "0.5rem" }}>
            {error}
          </p>
        </section>
      </AppShell>
    );
  }

  const goalIdsByHabit: Record<string, string[]> = {};
  for (const goal of goals) {
    for (const habit of goal.habits) {
      (goalIdsByHabit[habit.id] ??= []).push(goal.id);
    }
  }

  return (
    <AppShell wide>
      <HabitsClient
        habits={habits}
        goals={goals}
        goalIdsByHabit={goalIdsByHabit}
      />
    </AppShell>
  );
}
