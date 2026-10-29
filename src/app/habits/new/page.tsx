import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HabitWizard } from "@/components/HabitWizard";
import { listGoals } from "@/app/actions/goals";
import { listSystems } from "@/app/actions/systems";

export const dynamic = "force-dynamic";

export default async function NewHabitPage() {
  let goals: Awaited<ReturnType<typeof listGoals>> = [];
  let systems: Awaited<ReturnType<typeof listSystems>> = [];
  try {
    [goals, systems] = await Promise.all([listGoals(), listSystems()]);
  } catch {
    /* empty */
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/habits" className="text-sm text-muted-foreground hover:underline">
          ← Habits
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">Design a habit</h1>
      <HabitWizard
        goals={goals.map((g) => ({ id: g.id, title: g.title }))}
        systems={systems.map((s) => ({ id: s.id, name: s.name }))}
      />
    </AppShell>
  );
}
