import { AppShell } from "@/components/AppShell";
import { TodayClient } from "@/components/TodayClient";
import {
  getMissedRecoveryHint,
  getRoutineStepLogsForDate,
  getTodayData,
} from "@/app/actions/today";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayKey();
  let error: string | null = null;
  let payload: Awaited<ReturnType<typeof getTodayData>> | null = null;
  let stepLogs: Awaited<ReturnType<typeof getRoutineStepLogsForDate>> = [];
  let recoveryHint: string | null = null;

  try {
    [payload, stepLogs, recoveryHint] = await Promise.all([
      getTodayData(today),
      getRoutineStepLogsForDate(today),
      getMissedRecoveryHint(today),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load today.";
  }

  const needsMigration = Boolean(
    error && error.toLowerCase().includes("does not exist"),
  );

  return (
    <AppShell wide>
      {error ? (
        <section className="panel">
          <h2>Database update needed</h2>
          {needsMigration ? (
            <>
              <p className="form-error" style={{ marginTop: "0.5rem" }}>
                Apply the latest Prisma migrations against your database.
              </p>
              <p style={{ marginTop: "0.75rem", color: "var(--muted-foreground)" }}>
                Run <code>npm run db:deploy</code> (or{" "}
                <code>npx prisma migrate deploy</code>), then refresh.
              </p>
            </>
          ) : (
            <p className="form-error">{error}</p>
          )}
        </section>
      ) : payload ? (
        <TodayClient
          dateKey={today}
          items={payload.items}
          routines={payload.routines}
          stepLogs={stepLogs}
          weekAdherence={payload.weekAdherence}
          recoveryHint={recoveryHint}
        />
      ) : null}
    </AppShell>
  );
}
