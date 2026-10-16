"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adoptPractice, createCommunicatorGoalAction } from "@/app/actions/library";
import {
  COMMUNICATION_BOOKS,
  COMMUNICATOR_TEMPLATE,
} from "@/lib/content/communication-books";

type LibraryClientProps = {
  /** practice keys already adopted as active habits (their source_key). */
  adoptedKeys: string[];
  hasCommunicator: boolean;
};

function AdoptButton({
  practiceKey,
  adopted,
  onAdopted,
  onBusyChange,
  busy,
}: {
  practiceKey: string;
  adopted: boolean;
  onAdopted: (key: string) => void;
  onBusyChange: (busy: boolean) => void;
  busy: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (adopted) {
    return (
      <button type="button" className="adopt-btn adopted" disabled>
        Adopted ✓
      </button>
    );
  }

  return (
    <button
      type="button"
      className="adopt-btn"
      disabled={busy}
      onClick={() => {
        onBusyChange(true);
        startTransition(async () => {
          const result = await adoptPractice(practiceKey);
          if (result.ok) {
            onAdopted(practiceKey);
            router.refresh();
          }
          onBusyChange(false);
        });
      }}
    >
      {busy ? "…" : "Adopt"}
    </button>
  );
}

export function LibraryClient({
  adoptedKeys,
  hasCommunicator,
}: LibraryClientProps) {
  const [adopted, setAdopted] = useState<Set<string>>(
    () => new Set(adoptedKeys),
  );
  const [busy, setBusy] = useState(false);

  return (
    <div className="library-page">
      <section className="today-head animate-fade-up">
        <h1>Library</h1>
        <p className="today-date">
          Communication practices from the books — adopt any as a daily or
          weekly habit.
        </p>
      </section>

      <section className="panel template-card animate-fade-up">
        <div className="panel-head">
          <h2>{COMMUNICATOR_TEMPLATE.title}</h2>
          <span className="freq-tag">Goal</span>
        </div>
        <p className="goal-identity">
          “{COMMUNICATOR_TEMPLATE.identityStatement}”
        </p>
        <p className="grid-hint" style={{ marginTop: "0.5rem" }}>
          {COMMUNICATOR_TEMPLATE.why}
        </p>
        <p className="grid-hint">
          One click creates the goal and {COMMUNICATOR_TEMPLATE.practiceKeys.length}{" "}
          starter practices as tasks.
        </p>
        {hasCommunicator ? (
          <Link href="/goals" className="adopt-btn adopted" style={{ marginTop: "0.6rem" }}>
            Goal created ✓ · View goals
          </Link>
        ) : (
          <form action={createCommunicatorGoalAction} style={{ marginTop: "0.6rem" }}>
            <button
              type="submit"
              className="adopt-btn"
              disabled={busy}
            >
              Create this goal
            </button>
          </form>
        )}
      </section>

      {COMMUNICATION_BOOKS.map((book, i) => (
        <section
          key={book.key}
          className="book animate-fade-up"
          style={{ animationDelay: `${60 + i * 40}ms` }}
        >
          <div className="book-head">
            <h2>{book.title}</h2>
            <p>
              {book.author} · {book.idea}
            </p>
          </div>

          {book.practices.map((practice) => (
            <div key={practice.key} className="practice">
              <div className="practice-body">
                <strong>{practice.text}</strong>
                <small>{practice.suggestion}</small>
              </div>
              <span
                className={`freq-tag ${practice.frequency === "weekly" ? "weekly" : ""}`}
              >
                {practice.frequency === "weekly" ? "Weekly" : "Daily"}
              </span>
              <AdoptButton
                practiceKey={practice.key}
                adopted={adopted.has(practice.key)}
                busy={busy}
                onBusyChange={setBusy}
                onAdopted={(key) =>
                  setAdopted((current) => new Set(current).add(key))
                }
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
