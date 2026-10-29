"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { adoptPractice, createCommunicatorGoalAction } from "@/app/actions/library";
import {
  COMMUNICATION_BOOKS,
  COMMUNICATOR_TEMPLATE,
} from "@/lib/content/communication-books";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      <Button size="sm" variant="secondary" disabled>
        <Check className="size-3.5" aria-hidden />
        Adopted
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={() => {
        onBusyChange(true);
        startTransition(async () => {
          const result = await adoptPractice(practiceKey);
          if (result.ok) {
            onAdopted(practiceKey);
            toast.success("Added to your habits.");
            router.refresh();
          } else {
            toast.error(result.error);
          }
          onBusyChange(false);
        });
      }}
    >
      Adopt
    </Button>
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
          <Badge variant="secondary">Goal</Badge>
        </div>
        <p className="goal-identity">
          “{COMMUNICATOR_TEMPLATE.identityStatement}”
        </p>
        <p className="grid-hint mt-2">{COMMUNICATOR_TEMPLATE.why}</p>
        <p className="grid-hint">
          One click creates the goal and{" "}
          {COMMUNICATOR_TEMPLATE.practiceKeys.length} starter practices as
          tasks.
        </p>
        <div className="mt-3">
          {hasCommunicator ? (
            <Button asChild size="sm" variant="secondary">
              <Link href="/goals">
                <Check className="size-3.5" aria-hidden />
                Goal created · View goals
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          ) : (
            <form action={createCommunicatorGoalAction}>
              <Button type="submit" size="sm" disabled={busy}>
                Create this goal
              </Button>
            </form>
          )}
        </div>
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
              <Badge
                variant={practice.frequency === "weekly" ? "outline" : "secondary"}
              >
                {practice.frequency === "weekly" ? "Weekly" : "Daily"}
              </Badge>
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
