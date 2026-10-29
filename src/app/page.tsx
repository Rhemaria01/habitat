import { AppShell } from "@/components/AppShell";
import { TodayClient } from "@/components/TodayClient";
import { listGoals } from "@/app/actions/goals";
import { listHabits } from "@/app/actions/habits";
import { getReflection, getWeeklyReview } from "@/app/actions/reflections";
import { getRoutineData } from "@/app/actions/routine";
import { todayKey, weekStartKey } from "@/lib/dates";
import { dayTypeForDate } from "@/lib/content/routine";
import { rememberLineForDate } from "@/lib/content/guides";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayKey();
  const weekStart = weekStartKey(today);

  let error: string | null = null;
  let habits: Awaited<ReturnType<typeof listHabits>> = [];
  let goals: Awaited<ReturnType<typeof listGoals>> = [];
  let routine: Awaited<ReturnType<typeof getRoutineData>> = {
    checkedSlots: [],
    links: [],
    slots: [],
  };
  let reflection = null;
  let weeklyReview = null;

  try {
    [habits, goals, routine, reflection, weeklyReview] = await Promise.all([
      listHabits(),
      listGoals(),
      getRoutineData(today),
      getReflection(today),
      getWeeklyReview(weekStart),
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
          <h2>Almost home</h2>
          {needsMigration ? (
            <>
              <p className="form-error" style={{ marginTop: "0.5rem" }}>
                Your database is missing the new growth tables/columns.
              </p>
              <p style={{ marginTop: "0.75rem", color: "var(--muted-foreground)" }}>
                In Supabase → SQL Editor, run{" "}
                <code>supabase/migrate_growth_features.sql</code>, then{" "}
                <code>supabase/migrate_editable_routine.sql</code> (and{" "}
                <code>supabase/migrate_sort_order.sql</code> if you haven&apos;t
                yet), then refresh.
              </p>
            </>
          ) : (
            <p className="form-error" style={{ marginTop: "0.5rem" }}>
              {error.includes("DATABASE_URL") ||
              error.includes("env") ||
              error.includes("Unauthorized")
                ? "Add DATABASE_URL, ACCESS_KEY, and SESSION_SECRET to .env.local, then run supabase/schema.sql."
                : error}
            </p>
          )}
        </section>
      ) : (
        <TodayClient
          dateKey={today}
          weekStart={weekStart}
          slots={routine.slots.filter(
            (s) => s.dayType === dayTypeForDate(today),
          )}
          checkedSlots={routine.checkedSlots}
          links={routine.links}
          allHabits={habits}
          goals={goals}
          reflection={reflection}
          weeklyReview={weeklyReview}
          isSunday={new Date().getDay() === 0}
          rememberLine={rememberLineForDate(today)}
        />
      )}
    </AppShell>
  );
}
