import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RoutineDetailClient } from "@/components/RoutinesClient";
import { getRoutine } from "@/app/actions/routines";
import { listHabits } from "@/app/actions/habits";

export const dynamic = "force-dynamic";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const routine = await getRoutine(id);
  if (!routine) notFound();
  const habits = await listHabits();

  return (
    <AppShell>
      <Link href="/routines" className="text-sm text-muted-foreground hover:underline">
        ← Routines
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{routine.name}</h1>
      <RoutineDetailClient
        routine={routine}
        habits={habits.map((h) => ({ id: h.id, name: h.name }))}
      />
    </AppShell>
  );
}
