import { listGoals } from "@/app/actions/goals";
import { AppShell } from "@/components/AppShell";
import { GoalsClient } from "@/components/GoalsClient";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  let error: string | null = null;
  let goals: Awaited<ReturnType<typeof listGoals>> = [];

  try {
    goals = await listGoals();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load goals.";
  }

  if (error) {
    return (
      <AppShell>
        <section className="panel">
          <h2>Couldn&apos;t load goals</h2>
          <p className="form-error" style={{ marginTop: "0.5rem" }}>
            {error}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <GoalsClient goals={goals} />
    </AppShell>
  );
}
