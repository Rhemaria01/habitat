"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { deleteHabit } from "@/app/actions/habits";
import { CheckInButton } from "@/components/CheckInButton";
import { HabitForm } from "@/components/HabitForm";
import { Heatmap } from "@/components/Heatmap";
import { MonthCalendar } from "@/components/MonthCalendar";
import { formatLongDate } from "@/lib/dates";
import { computeStreakStats } from "@/lib/streaks";
import type { HabitWithLogs } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RollingNumber } from "@/components/ui/rolling-number";
import { CardSpotlight } from "@/components/ui/card-spotlight";

type HabitDetailClientProps = {
  habit: HabitWithLogs;
};

export function HabitDetailClient({ habit }: HabitDetailClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const stats = computeStreakStats(habit.kind, habit.start_date, habit.logs);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteHabit(habit.id);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(`“${habit.name}” deleted.`);
      router.push("/habits");
      router.refresh();
    });
  }

  const hasFineTuning =
    habit.frequency === "weekly" ||
    habit.stack_after ||
    habit.two_minute_version ||
    habit.identity_proof;

  return (
    <div className="detail">
      <Link href="/habits" className="back-link animate-fade-up inline-flex items-center gap-1.5">
        <ArrowLeft className="size-4" aria-hidden />
        All habits
      </Link>

      <CardSpotlight
        className="overflow-hidden p-6 animate-fade-up"
        style={{ animationDelay: "40ms" }}
      >
        <section
          className="detail-hero relative z-[1]"
          style={{ ["--habit" as string]: habit.color }}
        >
        <span className={`kind-chip ${habit.kind}`}>
          {habit.kind === "build" ? "Growing" : "Quitting"}
        </span>
        {habit.frequency === "weekly" ? (
          <span className="freq-chip">Weekly</span>
        ) : null}
        <h1>{habit.name}</h1>
        <p className="detail-since">
          Since {formatLongDate(habit.start_date)} · {stats.daysSinceStart} day
          {stats.daysSinceStart === 1 ? "" : "s"}
        </p>

        <div className="streak-board">
          <div>
            <strong className="inline-flex items-center gap-2">
              <Flame className="size-5 opacity-70" aria-hidden />
              <RollingNumber value={stats.currentStreak} format={(n) => `${n}`} />
            </strong>
            <span>Current streak</span>
          </div>
          <div>
            <strong className="inline-flex items-center gap-2">
              <Trophy className="size-5 opacity-70" aria-hidden />
              <RollingNumber value={stats.bestStreak} format={(n) => `${n}`} />
            </strong>
            <span>Best streak</span>
          </div>
        </div>

          <CheckInButton
            habitId={habit.id}
            kind={habit.kind}
            startDate={habit.start_date}
            logs={habit.logs}
          />
        </section>
      </CardSpotlight>

      {hasFineTuning ? (
        <section
          className="panel habit-fine-tuning animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="panel-head">
            <h2>How it&apos;s built</h2>
          </div>
          {habit.stack_after ? (
            <p className="tuning-line">
              <span>Stack</span>After I {habit.stack_after.replace(/^after\s+i\s+/i, "")}, I
              will {habit.name.toLowerCase()}.
            </p>
          ) : null}
          {habit.two_minute_version ? (
            <p className="tuning-line">
              <span>2-Minute version</span>
              {habit.two_minute_version}
            </p>
          ) : null}
          {habit.identity_proof ? (
            <p className="tuning-line">
              <span>Identity vote</span>
              {habit.identity_proof}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="panel-head">
          <h2>History</h2>
        </div>

        <Tabs defaultValue="month">
          <TabsList>
            <TabsTrigger value="month">Month calendar</TabsTrigger>
            <TabsTrigger value="year">Year map</TabsTrigger>
          </TabsList>
          <TabsContent value="month">
            <MonthCalendar
              habitId={habit.id}
              kind={habit.kind}
              startDate={habit.start_date}
              logs={habit.logs}
            />
          </TabsContent>
          <TabsContent value="year">
            <Heatmap
              habitId={habit.id}
              kind={habit.kind}
              color={habit.color}
              startDate={habit.start_date}
              logs={habit.logs}
            />
          </TabsContent>
        </Tabs>
      </section>

      <section
        className="panel animate-fade-up"
        style={{ animationDelay: "180ms" }}
      >
        <div className="panel-head">
          <h2>{editing ? "Edit habit" : "Care"}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit"}
          </Button>
        </div>

        {editing ? (
          <HabitForm
            habit={habit}
            onDone={() => setEditing(false)}
            compact
          />
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={pending}>
                Delete habit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{habit.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the habit and all of its check-in history. It
                  can’t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  );
}
