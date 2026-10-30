import { AppShell } from "@/components/AppShell";
import { OnboardingClient } from "@/components/OnboardingClient";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <AppShell>
      <OnboardingClient />
    </AppShell>
  );
}
