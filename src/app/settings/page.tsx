import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "@/components/SettingsClient";
import { getProfile } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfile();
  return (
    <AppShell wide statsLayout>
      <header className="page-head mb-2 animate-fade-up">
        <h1>Settings</h1>
        <p className="page-sub">
          Customize your experience, data and preferences.
        </p>
      </header>
      <SettingsClient profile={profile} />
    </AppShell>
  );
}
