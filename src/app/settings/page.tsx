import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "@/components/SettingsClient";
import { getProfile } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfile();
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <SettingsClient profile={profile} />
    </AppShell>
  );
}
