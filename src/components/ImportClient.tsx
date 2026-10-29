"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleCheck, CircleAlert, Download } from "lucide-react";
import { toast } from "sonner";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

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

  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [exportBusy, setExportBusy] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const template = TEMPLATES[tab];

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
        toast.error(res.error);
        setPreview(parseImportJson(raw));
        return;
      }
      setResult(res.data);
      setPreview(null);
      setRaw("");
      toast.success(
        `Imported ${res.data.habitsCreated} habits · ${res.data.goalsCreated} goals.`,
      );
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
        toast.success("Backup downloaded.");
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Export failed.";
        setExportNote(msg);
        toast.error(msg);
      })
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
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Export failed.";
        setExportNote(msg);
        toast.error(msg);
      })
      .finally(() => setExportBusy(false));
  }

  return (
    <div className="io-page">
      <section className="today-head animate-fade-up">
        <h1>Import &amp; export</h1>
        <p className="today-date">
          Ask any AI to design your habits or goals, then paste its JSON back
          in.
        </p>
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "40ms" }}
      >
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

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="panel-head">
          <h2>1. Templates for the AI</h2>
        </div>
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(v) => v && setTab(v as TemplateKey)}
          className="w-full justify-stretch rounded-lg bg-muted p-1"
          size="sm"
        >
          {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
            <ToggleGroupItem key={key} value={key} className="flex-1">
              {TEMPLATES[key].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="grid-hint mt-3">{template.hint}</p>
        <CodeBlock
          className="mt-2"
          tabs={[
            { label: "Prompt", code: template.prompt },
            {
              label: "Example JSON",
              code: JSON.stringify(template.example, null, 2),
              language: "json",
            },
          ]}
        />
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="panel-head">
          <h2>2. Paste the AI JSON &amp; import</h2>
        </div>
        <Textarea
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
          className="font-mono text-xs"
        />

        {pending ? (
          <Skeleton className="mt-3 h-20 w-full rounded-lg" />
        ) : preview && !preview.ok ? (
          <Alert variant="destructive" className="mt-3">
            <CircleAlert className="size-4" aria-hidden />
            <AlertDescription>
              <p className="font-semibold">Couldn&apos;t import this yet:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {preview.errors.map((msg, i) => (
                  <li key={`e${i}`}>{msg}</li>
                ))}
                {preview.warnings.map((msg, i) => (
                  <li key={`w${i}`} className="text-chart-2">
                    {msg}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : preview && preview.ok ? (
          <Alert className="mt-3">
            <CircleCheck className="size-4" aria-hidden />
            <AlertDescription>
              <p className="font-semibold">Ready to import:</p>
              <p className="mt-1 tabular-nums">
                {preview.doc.habits.length} habit(s) ·{" "}
                {preview.doc.goals.length} goal(s)
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
                <ul className="mt-1 list-disc space-y-1 pl-5 text-chart-2">
                  {preview.warnings.map((msg, i) => (
                    <li key={`w${i}`}>{msg}</li>
                  ))}
                </ul>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : result ? (
          <Alert className="mt-3">
            <CircleCheck className="size-4" aria-hidden />
            <AlertDescription>
              <p className="font-semibold">Imported.</p>
              <p className="mt-1 tabular-nums">
                {result.habitsCreated} habits · {result.goalsCreated} goals ·{" "}
                {result.tasksLinked} tasks linked
                {result.habitsSkipped + result.goalsSkipped > 0
                  ? ` · ${result.habitsSkipped + result.goalsSkipped} already existed (skipped)`
                  : ""}
              </p>
              {result.warnings.length > 0 ? (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-chart-2">
                  {result.warnings.map((msg, i) => (
                    <li key={`w${i}`}>{msg}</li>
                  ))}
                </ul>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="io-actions">
          <Button variant="secondary" onClick={onPreview} disabled={!raw.trim()}>
            Check JSON
          </Button>
          <Button onClick={onImport} disabled={pending || !preview?.ok}>
            {pending ? "Importing…" : "Import"}
          </Button>
        </div>
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "160ms" }}
      >
        <div className="panel-head">
          <h2>3. Export what you have</h2>
        </div>
        <p className="grid-hint mt-0">
          Grab your current habits and goals as a JSON backup — or load them
          into the box above to tweak and re-import.
        </p>
        <div className="io-actions">
          <Button onClick={onExportDownload} disabled={exportBusy}>
            <Download className="size-4" aria-hidden />
            {exportBusy ? "Working…" : "Download JSON"}
          </Button>
          <Button variant="secondary" onClick={onExportToBox} disabled={exportBusy}>
            Load into box
          </Button>
        </div>
        {exportNote ? (
          <p className="text-xs text-muted-foreground">{exportNote}</p>
        ) : null}
      </section>
    </div>
  );
}
