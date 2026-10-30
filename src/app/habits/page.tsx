import { listHabits } from "@/app/actions/habits";
import { AppShell } from "@/components/AppShell";
import { HabitsClient } from "@/components/HabitsClient";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  let error: string | null = null;
  let habits: Awaited<ReturnType<typeof listHabits>> = [];

  try {
    habits = await listHabits();
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

  return (
    <AppShell wide fullWidth>
      <HabitsClient habits={habits} />
    </AppShell>
  );
}
