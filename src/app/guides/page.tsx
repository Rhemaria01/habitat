import Link from "next/link";
import { AppShell } from "@/components/AppShell";
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
          <div className="guide-list">
            {FEELING_GUIDES.map((guide) => (
              <details key={guide.key} className="guide-card">
                <summary>
                  <span className="guide-glyph" aria-hidden>
                    {guide.glyph}
                  </span>
                  {guide.feeling}
                </summary>
                <div className="guide-body">
                  <p style={{ marginTop: 0 }}>{guide.why}</p>
                  <ol>
                    {guide.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="guide-remember">{guide.remember}</p>
                  {guide.action ? (
                    <Link href={guide.action.href} className="guide-cta">
                      {guide.action.label} →
                    </Link>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
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
          <p className="guide-remember" style={{ marginTop: 0 }}>
            {MAIN_LESSON}
          </p>
          <p className="grid-hint" style={{ marginTop: "0.8rem" }}>
            {GUIDE_NOTE}
          </p>
          <p className="grid-hint">
            Living the plan starts here:{" "}
            <Link href="/routine" className="guide-cta">
              Open today&apos;s routine →
            </Link>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
