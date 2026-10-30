import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HabitForm } from "@/components/HabitForm";

export const dynamic = "force-dynamic";

export default function NewHabitPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/habits" className="text-sm text-muted-foreground hover:underline">
          ← Habits
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">New habit</h1>
      <HabitForm />
    </AppShell>
  );
}
