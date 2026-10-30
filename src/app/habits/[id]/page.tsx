import Link from "next/link";
import nextDynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getHabit } from "@/app/actions/habits";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

const HabitDetailClient = nextDynamic(
  () =>
    import("@/components/HabitDetailClient").then((mod) => ({
      default: mod.HabitDetailClient,
    })),
  {
    loading: () => (
      <section className="panel">
        <p className="text-sm text-muted-foreground">Loading habit…</p>
      </section>
    ),
  },
);

type HabitPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HabitPage({ params }: HabitPageProps) {
  const { id } = await params;

  let habit = null;
  let errorMessage: string | null = null;
  try {
    habit = await getHabit(id);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Could not load this habit.";
  }

  if (errorMessage) {
    return (
      <AppShell>
        <section className="panel">
          <p className="form-error">{errorMessage}</p>
          <Link href="/habits" className="back-link">
            ← All habits
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!habit) notFound();

  return (
    <AppShell>
      <HabitDetailClient habit={habit} />
    </AppShell>
  );
}
