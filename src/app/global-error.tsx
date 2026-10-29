"use client";

import "./globals.css";

/**
 * Last-resort boundary that replaces the root layout when the layout itself
 * throws. Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div className="offline-card">
            <h1>Something went wrong</h1>
            <p>The app ran into an unexpected error. Try reloading.</p>
            <div className="error-actions">
              <button type="button" className="primary-btn" onClick={reset}>
                Try again
              </button>
            </div>
            {error?.digest ? (
              <p className="error-digest">Reference: {error.digest}</p>
            ) : null}
          </div>
        </div>
      </body>
    </html>
  );
}
