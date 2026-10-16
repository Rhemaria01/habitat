import { listHabits } from "@/app/actions/habits";
import { getRoutineData } from "@/app/actions/routine";
import { AppShell } from "@/components/AppShell";
import { RoutineClient } from "@/components/RoutineClient";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function RoutinePage() {
  const today = todayKey();

  let error: string | null = null;
  let habits: Awaited<ReturnType<typeof listHabits>> = [];
  let routine: Awaited<ReturnType<typeof getRoutineData>> = {
    checkedSlots: [],
    links: [],
    slots: [],
  };

  try {
    [habits, routine] = await Promise.all([listHabits(), getRoutineData(today)]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load the routine.";
  }

  if (error) {
    return (
      <AppShell>
        <section className="panel">
          <h2>Couldn&apos;t load the routine</h2>
          <p className="form-error" style={{ marginTop: "0.5rem" }}>
            {error}
          </p>
        </section>
      </AppShell>
    );
  }

  const day = new Date().getDay();
  const todayType = day === 0 || day === 6 ? "weekend" : "weekday";

  return (
    <AppShell wide>
      <RoutineClient
        dateKey={today}
        todayType={todayType}
        checkedSlots={routine.checkedSlots}
        links={routine.links}
        allHabits={habits}
        allSlots={routine.slots}
      />
    </AppShell>
  );
}
