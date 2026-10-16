import { listGoals } from "@/app/actions/goals";
import { listHabits } from "@/app/actions/habits";
import { AppShell } from "@/components/AppShell";
import { LibraryClient } from "@/components/LibraryClient";
import { COMMUNICATOR_TEMPLATE } from "@/lib/content/communication-books";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  let error: string | null = null;
  let habits: Awaited<ReturnType<typeof listHabits>> = [];
  let goals: Awaited<ReturnType<typeof listGoals>> = [];

  try {
    [habits, goals] = await Promise.all([listHabits(), listGoals()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load the library.";
  }

  if (error) {
    return (
      <AppShell>
        <section className="panel">
          <h2>Couldn&apos;t load the library</h2>
          <p className="form-error" style={{ marginTop: "0.5rem" }}>
            {error}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <LibraryClient
        adoptedKeys={habits
          .map((h) => h.source_key)
          .filter((k): k is string => Boolean(k))}
        hasCommunicator={goals.some(
          (g) => g.title === COMMUNICATOR_TEMPLATE.title,
        )}
      />
    </AppShell>
  );
}
