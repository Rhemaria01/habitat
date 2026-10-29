"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Pencil } from "lucide-react";
import { RoutineTimeline } from "@/components/RoutineTimeline";
import { RoutineEditor } from "@/components/RoutineEditor";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  FIVE_KEY_HABITS,
  THREE_RULES,
  WEEKEND_RULES,
  type DayType,
  type RoutineSlot,
} from "@/lib/content/routine";
import type { HabitWithLogs, RoutineSlotLink } from "@/lib/types";

type RoutineClientProps = {
  dateKey: string;
  todayType: DayType;
  checkedSlots: string[];
  links: RoutineSlotLink[];
  allHabits: HabitWithLogs[];
  /** Editable slots loaded from the database (both day types). */
  allSlots: RoutineSlot[];
};

export function RoutineClient({
  dateKey,
  todayType,
  checkedSlots,
  links,
  allHabits,
  allSlots,
}: RoutineClientProps) {
  const [dayType, setDayType] = useState<DayType>(todayType);
  const [editing, setEditing] = useState(false);
  const slots = allSlots.filter((s) => s.dayType === dayType);

  return (
    <div className="routine-page">
      <section className="today-head animate-fade-up">
        <h1>Routine</h1>
        <p className="today-date">
          The day, designed on purpose — what to lean into, and what to step
          away from.
        </p>
      </section>

      <ToggleGroup
        type="single"
        value={dayType}
        onValueChange={(v) => v && setDayType(v as DayType)}
        className="w-full justify-stretch rounded-lg bg-muted p-1"
        size="sm"
        aria-label="Day type"
      >
        <ToggleGroupItem value="weekday" className="flex-1">
          Weekday
          {todayType === "weekday" ? " · Today" : ""}
        </ToggleGroupItem>
        <ToggleGroupItem value="weekend" className="flex-1">
          Weekend
          {todayType === "weekend" ? " · Today" : ""}
        </ToggleGroupItem>
      </ToggleGroup>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="panel-head">
          <h2>{dayType === "weekday" ? "The weekday arc" : "The weekend arc"}</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? (
              "Done editing"
            ) : (
              <>
                <Pencil className="size-3.5" aria-hidden />
                Edit routine
              </>
            )}
          </Button>
        </div>
        {editing ? (
          <>
            <p className="grid-hint">
              Add, rewrite, reorder, or remove the moments that make up this
              arc. Changes save to your routine.
            </p>
            <RoutineEditor dayType={dayType} slots={slots} />
          </>
        ) : (
          <>
            <p className="grid-hint">
              Associate each moment with a good habit to grow or a bad habit to
              quit — then check it in right here.
            </p>
            <RoutineTimeline
              key={dayType}
              dateKey={dateKey}
              slots={slots}
              initialChecked={checkedSlots}
              initialLinks={links.filter((l) =>
                slots.some((s) => s.key === l.slot_key),
              )}
              allHabits={allHabits}
              allowLinking
            />
          </>
        )}
      </section>

      {dayType === "weekend" ? (
        <section
          className="panel animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="panel-head">
            <h2>Weekend rules</h2>
          </div>
          <table className="rule-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Do</th>
                <th>Don&apos;t</th>
              </tr>
            </thead>
            <tbody>
              {WEEKEND_RULES.map((r) => (
                <tr key={r.rule}>
                  <td>{r.rule}</td>
                  <td className="do-cell">{r.doText}</td>
                  <td className="dont-cell">{r.dontText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "140ms" }}
      >
        <div className="panel-head">
          <h2>Five habits that matter most</h2>
        </div>
        <ul className="rule-list">
          {FIVE_KEY_HABITS.map((habit) => (
            <li key={habit.key}>
              <strong>{habit.title}.</strong> {habit.text}
            </li>
          ))}
        </ul>
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "180ms" }}
      >
        <div className="panel-head">
          <h2>The three rules</h2>
        </div>
        <ul className="rule-list">
          {THREE_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="grid-hint mt-3">
          Feeling stuck mid-day?{" "}
          <Link href="/guides" className="guide-cta inline-flex items-center gap-1">
            Open the feeling guides
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </p>
      </section>
    </div>
  );
}
