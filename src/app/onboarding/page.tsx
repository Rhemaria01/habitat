import { AppShell } from "@/components/AppShell";
import { OnboardingClient } from "@/components/OnboardingClient";
import { getOnboardingState } from "@/app/actions/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { step } = await getOnboardingState();
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Setup</h1>
      <OnboardingClient initialStep={step} />
    </AppShell>
  );
}
