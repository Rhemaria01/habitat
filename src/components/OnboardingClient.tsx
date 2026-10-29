"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { completeOnboarding, saveOnboardingProgress } from "@/app/actions/onboarding";
import { createGoal } from "@/app/actions/goals";
import type { OnboardingStep } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STEPS: { id: OnboardingStep; title: string }[] = [
  { id: "direction", title: "Direction" },
  { id: "goals", title: "Goals" },
  { id: "audit", title: "Patterns" },
  { id: "focus", title: "Focus" },
  { id: "habit", title: "First habit" },
  { id: "schedule", title: "Schedule" },
];

type OnboardingClientProps = {
  initialStep: OnboardingStep;
};

export function OnboardingClient({ initialStep }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep === "done" ? "direction" : initialStep);
  const [identity, setIdentity] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function advance(next: OnboardingStep) {
    startTransition(async () => {
      await saveOnboardingProgress(next, { identity, goalTitle });
      if (next === "done") {
        await completeOnboarding();
        router.push("/");
        router.refresh();
      } else setStep(next);
    });
  }

  function createFirstGoal() {
    if (!goalTitle.trim()) {
      advance("audit");
      return;
    }
    startTransition(async () => {
      const r = await createGoal({
        title: goalTitle.trim(),
        identity_statement: identity.trim() || null,
        color: "#5E6AD2",
      });
      if (r.ok) advance("audit");
      else toast.error(r.error);
    });
  }

  const index = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="panel max-w-lg space-y-6">
      <p className="text-sm text-muted-foreground">
        Step {Math.max(1, index + 1)} of {STEPS.length} · skippable anytime
      </p>

      {step === "direction" ? (
        <>
          <h2>Direction</h2>
          <Label>Optional identity or value</Label>
          <Textarea
            placeholder="Who you are becoming through your actions"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => advance("goals")}>
              Skip
            </Button>
            <Button type="button" onClick={() => advance("goals")}>
              Continue
            </Button>
          </div>
        </>
      ) : null}

      {step === "goals" ? (
        <>
          <h2>First goal</h2>
          <Label>Outcome title</Label>
          <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => advance("audit")}>
              Skip
            </Button>
            <Button type="button" disabled={pending} onClick={createFirstGoal}>
              Save goal
            </Button>
          </div>
        </>
      ) : null}

      {step === "audit" || step === "focus" || step === "habit" || step === "schedule" ? (
        <>
          <h2>Next steps</h2>
          <p className="text-sm text-muted-foreground">
            Use the habit scorecard on{" "}
            <Link href="/review" className="underline">
              Review
            </Link>
            , design habits with the{" "}
            <Link href="/habits/new" className="underline">
              habit builder
            </Link>
            , and organize{" "}
            <Link href="/routines" className="underline">
              routines
            </Link>
            .
          </p>
          <Button type="button" onClick={() => advance("done")}>
            Go to Today
          </Button>
        </>
      ) : null}
    </div>
  );
}
