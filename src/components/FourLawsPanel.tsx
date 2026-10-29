"use client";

import { HelpingHand } from "lucide-react";
import { BUILD_LAWS, QUIT_LAWS, WEEKLY_REVIEW_QUESTION } from "@/lib/content/atomic-habits";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FourLawsPanelProps = {
  /** Which flavor of laws to show — quitting uses the inversions. */
  mode: "build" | "quit";
};

export function FourLawsPanel({ mode }: FourLawsPanelProps) {
  const laws = mode === "build" ? BUILD_LAWS : QUIT_LAWS;

  return (
    <div className="laws-panel flex flex-col gap-3">
      <p className="text-sm font-semibold text-muted-foreground tracking-tight">
        {mode === "build"
          ? "The Four Laws — make it happen"
          : "The Four Inversions — make it stop"}
      </p>

      <Accordion
        type="single"
        collapsible
        className="flex flex-col gap-2"
      >
        {laws.map((law) => (
          <AccordionItem
            key={law.key}
            value={law.key}
            className="rounded-lg border bg-card px-4 shadow-none"
          >
            <AccordionTrigger className="py-3 text-left text-sm font-semibold hover:no-underline">
              {law.title}
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <p className="text-sm text-muted-foreground">{law.hint}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                {law.prompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Alert>
        <HelpingHand className="size-4" aria-hidden />
        <AlertDescription>{WEEKLY_REVIEW_QUESTION}</AlertDescription>
      </Alert>
    </div>
  );
}
