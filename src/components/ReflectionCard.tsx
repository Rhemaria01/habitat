"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReflection } from "@/app/actions/reflections";
import type { Reflection } from "@/lib/types";

type ReflectionCardProps = {
  dateKey: string;
  initial: Reflection | null;
};

export function ReflectionCard({ dateKey, initial }: ReflectionCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);
  const [wentWell, setWentWell] = useState(initial?.went_well ?? "");
  const [distracted, setDistracted] = useState(initial?.distracted ?? "");
  const [improve, setImprove] = useState(initial?.improve_tomorrow ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveReflection(dateKey, {
        went_well: wentWell,
        distracted,
        improve_tomorrow: improve,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form className="reflect-fields" onSubmit={onSubmit}>
      <label className="field">
        <span>What went well</span>
        <textarea
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          maxLength={500}
          placeholder="One honest win from today…"
        />
      </label>
      <label className="field">
        <span>What distracted me</span>
        <textarea
          value={distracted}
          onChange={(e) => setDistracted(e.target.value)}
          maxLength={500}
          placeholder="Where did the monkey-mind jump?"
        />
      </label>
      <label className="field">
        <span>What I&apos;ll improve tomorrow</span>
        <textarea
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
          maxLength={500}
          placeholder="One small thing, not five…"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-btn" disabled={pending}>
        {pending
          ? "Saving…"
          : saved
            ? "Update tonight's review"
            : "Save tonight's three lines"}
      </button>
    </form>
  );
}
