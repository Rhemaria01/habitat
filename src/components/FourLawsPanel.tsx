"use client";

import { BUILD_LAWS, QUIT_LAWS, WEEKLY_REVIEW_QUESTION } from "@/lib/content/atomic-habits";

type FourLawsPanelProps = {
  /** Which flavor of laws to show — quitting uses the inversions. */
  mode: "build" | "quit";
};

export function FourLawsPanel({ mode }: FourLawsPanelProps) {
  const laws = mode === "build" ? BUILD_LAWS : QUIT_LAWS;

  return (
    <details className="laws-helper">
      <summary className="laws-helper-head">
        {mode === "build"
          ? "The Four Laws — make it happen"
          : "The Four Inversions — make it stop"}
      </summary>

      <div className="laws">
        {laws.map((law) => (
          <div key={law.key} className="law">
            <h3>{law.title}</h3>
            <p>{law.hint}</p>
            <ul>
              {law.prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="review-ask">{WEEKLY_REVIEW_QUESTION}</p>
    </details>
  );
}
