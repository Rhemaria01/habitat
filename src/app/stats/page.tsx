import { AppShell } from "@/components/AppShell";
import { StatsClient } from "@/components/StatsClient";
import { getStatsDashboard } from "@/app/actions/stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const data = await getStatsDashboard();

  return (
    <AppShell wide>
      <h1 className="mb-4 text-2xl font-semibold">Stats</h1>
      <StatsClient data={data} />
    </AppShell>
  );
}
