import { AppShell } from "@/components/AppShell";
import { SystemsClient } from "@/components/SystemsClient";
import { listHabits } from "@/app/actions/habits";
import { listSystems } from "@/app/actions/systems";

export const dynamic = "force-dynamic";

export default async function SystemsPage() {
  const [systems, habits] = await Promise.all([listSystems(), listHabits()]);
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Systems</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Repeatable processes that connect goals to daily habits.
      </p>
      <SystemsClient
        systems={systems}
        habits={habits.map((h) => ({ id: h.id, name: h.name }))}
      />
    </AppShell>
  );
}
