import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSystem } from "@/app/actions/systems";
import { adherenceForRange } from "@/lib/domain/adherence";
import { listHabits } from "@/app/actions/habits";
import { addDays, todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const system = await getSystem(id);
  if (!system) notFound();

  const habits = await listHabits();
  const linked = habits.filter((h) => h.system_id === id);
  const end = todayKey();
  const start = addDays(end, -13);

  return (
    <AppShell>
      <Link href="/systems" className="text-sm text-muted-foreground hover:underline">
        ← Systems
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{system.name}</h1>
      {system.description ? (
        <p className="mt-2 text-muted-foreground">{system.description}</p>
      ) : null}
      <section className="panel mt-6">
        <h2>Linked goals</h2>
        <ul className="mt-2 list-inside list-disc text-sm">
          {system.goals.map((g) => (
            <li key={g.id}>
              <Link href={`/goals/${g.id}`} className="underline">
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel mt-4">
        <h2>Execution (last 14 days)</h2>
        <ul className="mt-3 space-y-2">
          {linked.map((h) => {
            const summary = adherenceForRange(h, h.logs, start, end);
            return (
              <li key={h.id} className="flex justify-between text-sm">
                <Link href={`/habits/${h.id}`} className="underline">
                  {h.name}
                </Link>
                <span className="text-muted-foreground">
                  {summary.rate !== null ? `${summary.rate}%` : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="panel mt-4 grid gap-2 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">Working well</h3>
          <p className="text-sm text-muted-foreground">{system.working_well || "—"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Friction</h3>
          <p className="text-sm text-muted-foreground">{system.causing_friction || "—"}</p>
        </div>
      </section>
    </AppShell>
  );
}
