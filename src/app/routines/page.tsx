import { AppShell } from "@/components/AppShell";
import { RoutinesClient } from "@/components/RoutinesClient";
import { listHabits } from "@/app/actions/habits";
import { listRoutines } from "@/app/actions/routines";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const [routines, habits] = await Promise.all([listRoutines(), listHabits()]);
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Routines</h1>
      <RoutinesClient
        routines={routines}
        habits={habits.map((h) => ({ id: h.id, name: h.name }))}
      />
    </AppShell>
  );
}
