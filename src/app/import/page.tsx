import { AppShell } from "@/components/AppShell";
import { ImportClient } from "@/components/ImportClient";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <AppShell wide>
      <ImportClient />
    </AppShell>
  );
}
