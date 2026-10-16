"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { listGoals } from "@/app/actions/goals";
import { listHabits } from "@/app/actions/habits";
import { importHabitsGoals, type ImportSummary } from "@/app/actions/import";
import {
  COMBINED_PROMPT,
  EXAMPLE_GOALS,
  EXAMPLE_HABITS,
  GOALS_PROMPT,
  HABITS_PROMPT,
  buildExportDocument,
  parseImportJson,
  type ImportDocument,
  type ParseResult,
} from "@/lib/import-export";

type TemplateKey = "habits" | "goals" | "combined";

const TEMPLATES: Record<
  TemplateKey,
  { label: string; hint: string; prompt: string; example: ImportDocument }
> = {
  habits: {
    label: "Habits",
    hint: "Hand this to any AI, describe the habits you want, get JSON back.",
    prompt: HABITS_PROMPT,
    example: EXAMPLE_HABITS,
  },
  goals: {
    label: "Goals",
    hint: "Describe one outcome — the AI builds an identity plus its habits.",
    prompt: GOALS_PROMPT,
    example: EXAMPLE_GOALS,
  },
  combined: {
    label: "Habits + Goals",
    hint: "Plan a whole set at once, with habits grouped under goals.",
    prompt: COMBINED_PROMPT,
    example: { ...EXAMPLE_GOALS, habits: EXAMPLE_HABITS.habits },
  },
};

export function ImportClient() {
  const router = useRouter();
  const [tab, setTab] = useState<TemplateKey>("habits");
  const [copied, setCopied] = useState<string | null>(null);

  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [exportBusy, setExportBusy] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const template = TEMPLATES[tab];

  function copy(key: string, text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(key);
        window.setTimeout(() => setCopied(null), 1600);
      })
      .catch(() => setError("Copy failed — select the text and copy manually."));
  }

  function onPreview() {
    setError(null);
    setResult(null);
    setPreview(parseImportJson(raw));
  }

  function onImport() {
    setError(null);
    startTransition(async () => {
      const res = await importHabitsGoals(raw);
      if (!res.ok) {
        setError(res.error);
        setPreview(parseImportJson(raw));
        return;
      }
      setResult(res.data);
      setPreview(null);
      setRaw("");
      router.refresh();
    });
  }

  async function buildMyDocument(): Promise<string> {
    const [habits, goals] = await Promise.all([listHabits(), listGoals()]);
    return JSON.stringify(buildExportDocument(habits, goals), null, 2);
  }

  function onExportDownload() {
    setExportBusy(true);
    setExportNote(null);
    buildMyDocument()
      .then((json) => {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `habitat-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExportNote("Downloaded your habits + goals as JSON.");
      })
      .catch((e) => setExportNote(e instanceof Error ? e.message : "Export failed."))
      .finally(() => setExportBusy(false));
  }

  function onExportToBox() {
    setExportBusy(true);
    setExportNote(null);
    buildMyDocument()
      .then((json) => {
        setRaw(json);
        setPreview(parseImportJson(json));
        setResult(null);
        setExportNote("Loaded your current data above as a starting point.");
      })
      .catch((e) => setExportNote(e instanceof Error ? e.message : "Export failed."))
      .finally(() => setExportBusy(false));
  }

  return (
    <div className="io-page">
      <section className="today-head animate-fade-up">
        <h1>Import &amp; export</h1>
        <p className="today-date">
          Ask any AI to design your habits or goals, then paste its JSON back in.
        </p>
      </section>

      <section className="panel animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="panel-head">
          <h2>How it works</h2>
        </div>
        <ol className="io-steps">
          <li>Pick a template below and copy its prompt.</li>
          <li>
            Paste the prompt into ChatGPT / Claude / Gemini and replace the
            bracketed line with what you actually want.
          </li>
          <li>Copy the JSON the AI returns and paste it in the box further down.</li>
        </ol>
      </section>

      <section className="panel animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="panel-head">
          <h2>1. Templates for the AI</h2>
        </div>
        <div className="view-tabs" role="tablist" aria-label="Template">
          {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`view-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {TEMPLATES[key].label}
            </button>
          ))}
        </div>
        <p className="grid-hint" style={{ marginTop: "0.75rem" }}>
          {template.hint}
        </p>
        <pre className="template-box">{template.prompt}</pre>
        <div className="io-actions">
          <button
            type="button"
            className="primary-btn small"
            onClick={() => copy("prompt", template.prompt)}
          >
            {copied === "prompt" ? "Copied!" : "Copy prompt"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => copy("example", JSON.stringify(template.example, null, 2))}
          >
            {copied === "example" ? "Copied!" : "Copy example JSON"}
          </button>
        </div>
      </section>

      <section className="panel animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="panel-head">
          <h2>2. Paste the AI JSON &amp; import</h2>
        </div>
        <textarea
          className="io-textarea"
          rows={10}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setPreview(null);
            setResult(null);
            setError(null);
          }}
          placeholder='{ "version": 1, "habits": [ ... ], "goals": [ ... ] }'
          spellCheck={false}
        />

        {preview && !preview.ok ? (
          <div className="preview-block bad">
            <p className="preview-title">Couldn&apos;t import this yet:</p>
            <ul className="preview-list">
              {preview.errors.map((msg, i) => (
                <li key={`e${i}`}>{msg}</li>
              ))}
            </ul>
            {preview.warnings.length > 0 ? (
              <ul className="preview-list warn">
                {preview.warnings.map((msg, i) => (
                  <li key={`w${i}`}>{msg}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {preview && preview.ok ? (
          <div className="preview-block good">
            <p className="preview-title">Ready to import:</p>
            <p className="preview-count">
              {preview.doc.habits.length} habit(s) · {preview.doc.goals.length}{" "}
              goal(s)
              {preview.doc.goals.reduce(
                (sum, g) => sum + (g.habit_names?.length ?? 0),
                0,
              ) > 0
                ? ` · ${preview.doc.goals.reduce(
                    (sum, g) => sum + (g.habit_names?.length ?? 0),
                    0,
                  )} task link(s)`
                : ""}
            </p>
            {preview.warnings.length > 0 ? (
              <ul className="preview-list warn">
                {preview.warnings.map((msg, i) => (
                  <li key={`w${i}`}>{msg}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {result ? (
          <div className="preview-block done">
            <p className="preview-title">Imported.</p>
            <p className="preview-count">
              {result.habitsCreated} habits · {result.goalsCreated} goals ·{" "}
              {result.tasksLinked} tasks linked
              {result.habitsSkipped + result.goalsSkipped > 0
                ? ` · ${result.habitsSkipped + result.goalsSkipped} already existed (skipped)`
                : ""}
            </p>
            {result.warnings.length > 0 ? (
              <ul className="preview-list warn">
                {result.warnings.map((msg, i) => (
                  <li key={`w${i}`}>{msg}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="io-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={onPreview}
            disabled={!raw.trim()}
          >
            Check JSON
          </button>
          <button
            type="button"
            className="primary-btn small"
            onClick={onImport}
            disabled={pending || !preview?.ok}
          >
            {pending ? "Importing…" : "Import"}
          </button>
        </div>
      </section>

      <section className="panel animate-fade-up" style={{ animationDelay: "160ms" }}>
        <div className="panel-head">
          <h2>3. Export what you have</h2>
        </div>
        <p className="grid-hint" style={{ marginTop: 0 }}>
          Grab your current habits and goals as a JSON backup — or load them into
          the box above to tweak and re-import.
        </p>
        <div className="io-actions">
          <button
            type="button"
            className="primary-btn small"
            onClick={onExportDownload}
            disabled={exportBusy}
          >
            {exportBusy ? "Working…" : "Download JSON"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={onExportToBox}
            disabled={exportBusy}
          >
            Load into box
          </button>
        </div>
        {exportNote ? <p className="field-hint">{exportNote}</p> : null}
      </section>
    </div>
  );
}
