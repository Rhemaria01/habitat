import Link from "next/link";
import { SoftShell } from "@/components/SoftShell";

export default function NotFound() {
  return (
    <SoftShell>
      <div className="offline-card animate-fade-up">
        <h1>Nothing nested here</h1>
        <p>That habit wandered off.</p>
        <Link href="/" className="back-link" style={{ marginTop: "1rem" }}>
          ← Back home
        </Link>
      </div>
    </SoftShell>
  );
}