import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DAILY_PLAN,
  FEELING_GUIDES,
  GUIDE_NOTE,
  MAIN_LESSON,
} from "@/lib/content/guides";

export const dynamic = "force-dynamic";

export default function GuidesPage() {
  return (
    <AppShell wide>
      <div className="guides-page">
        <section className="today-head animate-fade-up">
          <h1>Guides</h1>
          <p className="today-date">
            What to do with what you feel — read the one that matches this
            moment.
          </p>
        </section>

        <section
          className="panel animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="panel-head">
            <h2>Pick the feeling you&apos;re in</h2>
          </div>
          <Accordion
            type="multiple"
            className="guide-list flex flex-col gap-2"
          >
            {FEELING_GUIDES.map((guide) => (
              <AccordionItem
                key={guide.key}
                value={guide.key}
                className="guide-card rounded-lg border bg-card px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="inline-flex items-center gap-2">
                    <span className="guide-glyph" aria-hidden>
                      {guide.glyph}
                    </span>
                    {guide.feeling}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="guide-body">
                    <p className="mt-0">{guide.why}</p>
                    <ol>
                      {guide.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="guide-remember">{guide.remember}</p>
                    {guide.action ? (
                      <Button asChild size="sm" variant="link" className="h-auto p-0">
                        <Link href={guide.action.href}>
                          {guide.action.label}
                          <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section
          className="panel animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <div className="panel-head">
            <h2>The simple daily plan</h2>
          </div>
          <table className="rule-table">
            <thead>
              <tr>
                <th>When</th>
                <th>What</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_PLAN.map((row) => (
                <tr key={row.when}>
                  <td>{row.when}</td>
                  <td className="do-cell">{row.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section
          className="panel animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <div className="panel-head">
            <h2>The main lesson</h2>
          </div>
          <p className="guide-remember mt-0">{MAIN_LESSON}</p>
          <p className="grid-hint mt-3">{GUIDE_NOTE}</p>
          <p className="grid-hint">
            Living the plan starts here:{" "}
            <Button asChild size="sm" variant="link" className="h-auto p-0 inline-flex items-center gap-1">
              <Link href="/routine">
                Open today&apos;s routine
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
