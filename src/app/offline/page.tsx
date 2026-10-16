import { SoftShell } from "@/components/SoftShell";

export default function OfflinePage() {
  return (
    <SoftShell>
      <div className="offline-card animate-fade-up">
        <h1>You’re offline</h1>
        <p>Habitat will be here when the connection comes home.</p>
      </div>
    </SoftShell>
  );
}
