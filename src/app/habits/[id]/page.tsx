import Link from "next/link";
import { notFound } from "next/navigation";
import { getHabit } from "@/app/actions/habits";
import { AppShell } from "@/components/AppShell";
import { HabitDetailClient } from "@/components/HabitDetailClient";

export const dynamic = "force-dynamic";

type HabitPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HabitPage({ params }: HabitPageProps) {
  const { id } = await params;

  let habit = null;
  try {
    habit = await getHabit(id);
  } catch {
    return (
      <AppShell>
        <section className="panel">
          <p className="form-error">Could not load this habit.</p>
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
