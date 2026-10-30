import { AppShell } from "@/components/AppShell";
import { StatsClient } from "@/components/StatsClient";
import { getStatsDashboard } from "@/app/actions/stats";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const today = todayKey();
  const now = new Date(`${today}T12:00:00`);
  const year = now.getFullYear();
  const month = now.getMonth();
  const range = "30d" as const;

  const data = await getStatsDashboard({ year, month, range });

  return (
    <AppShell wide statsLayout>
      <header className="page-head mb-2 animate-fade-up">
        <h1>Stats</h1>
        <p className="page-sub">
          Track your progress, find patterns and stay consistent.
        </p>
      </header>
      <StatsClient
        initialData={data}
        initialYear={year}
        initialMonth={month}
        initialRange={range}
      />
    </AppShell>
  );
}
