"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SoftShell } from "@/components/SoftShell";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * App-wide error boundary. Without this, any uncaught render/navigation error
 * (e.g. a stale client chunk after a hot reload) drops to Next's raw
 * "This page couldn't load" screen with no way to recover in-app.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
    if (error.name === "ChunkLoadError") {
      console.warn(
        "Stale JavaScript chunk — try a hard refresh (Cmd+Shift+R) or restart `npm run dev`.",
      );
    }
  }, [error]);

  return (
    <SoftShell>
      <div className="offline-card animate-fade-up">
        <h1>This page hit a snag</h1>
        <p>
          Something interrupted the page. Give it another go — your data is
          safe.
        </p>
        <div className="error-actions">
          <button type="button" className="primary-btn" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="back-link">
            ← Back home
          </Link>
        </div>
        {error.name === "ChunkLoadError" ? (
          <p className="text-sm text-muted-foreground mt-3">
            Your browser may be using an old cached script. Hard refresh the page
            (Cmd+Shift+R) or restart the dev server.
          </p>
        ) : null}
        {error.digest ? (
          <p className="error-digest">Reference: {error.digest}</p>
        ) : null}
      </div>
    </SoftShell>
  );
}
