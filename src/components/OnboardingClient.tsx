"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { HabitForm } from "@/components/HabitForm";
import { Button } from "@/components/ui/button";
import { useCompleteOnboardingMutation } from "@/hooks/api/use-mutations";

export function OnboardingClient() {
  const router = useRouter();
  const completeMutation = useCompleteOnboardingMutation();

  function finish() {
    completeMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/");
      },
    });
  }

  return (
    <div className="panel max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to Habitat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track habits on Today, manage them here, and check Stats when you want
          a longer view.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Add your first habit</h2>
        <HabitForm
          onDone={() => {
            finish();
          }}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={completeMutation.isPending}
          onClick={finish}
        >
          {completeMutation.isPending ? "Saving…" : "Skip for now"}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/habits">Browse habits</Link>
        </Button>
      </div>
    </div>
  );
}
