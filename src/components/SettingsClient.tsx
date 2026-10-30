"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  QueryErrorBanner,
  QueryLoadingOverlay,
} from "@/components/api/QueryLoading";
import { useProfileQuery } from "@/hooks/api/use-profile";
import {
  useExportUserDataMutation,
  useUpdateProfileMutation,
} from "@/hooks/api/use-mutations";

type SettingsClientProps = {
  profile: Profile;
};

export function SettingsClient({ profile: initial }: SettingsClientProps) {
  const {
    data: profile = initial,
    isFetching,
    isLoading,
    isError,
    error,
  } = useProfileQuery({ initialData: initial });

  const updateMutation = useUpdateProfileMutation();
  const exportMutation = useExportUserDataMutation();

  const [timezone, setTimezone] = useState(profile.timezone);
  const [weekStart, setWeekStart] = useState(String(profile.week_start));
  const [identityNote, setIdentityNote] = useState(profile.identity_note ?? "");

  const pending = updateMutation.isPending || exportMutation.isPending;

  function save() {
    updateMutation.mutate(
      {
        timezone: timezone.trim() || "Asia/Kolkata",
        week_start: Number(weekStart),
        identity_note: identityNote.trim() || null,
      },
      {
        onSuccess: (data) => {
          setTimezone(data.timezone);
          setWeekStart(String(data.week_start));
          setIdentityNote(data.identity_note ?? "");
        },
      },
    );
  }

  function exportData() {
    exportMutation.mutate(undefined, {
      onSuccess: (json) => {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `habitat-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  return (
    <div className="relative space-y-6 max-w-lg">
      <QueryLoadingOverlay show={isFetching && !isLoading} label="Loading profile…" />
      {isError ? <QueryErrorBanner error={error} /> : null}
      <section className="panel space-y-3">
        <h2>Preferences</h2>
        <div>
          <Label htmlFor="tz">Timezone</Label>
          <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ws">Week starts on (0=Sun … 6=Sat)</Label>
          <Input id="ws" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="id">Identity / values note (optional)</Label>
          <Input id="id" value={identityNote} onChange={(e) => setIdentityNote(e.target.value)} />
        </div>
        <Button type="button" disabled={pending} onClick={save}>
          {updateMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </section>
      <section className="panel space-y-3">
        <h2>Data</h2>
        <Button type="button" variant="outline" disabled={pending} onClick={exportData}>
          {exportMutation.isPending ? "Exporting…" : "Export JSON"}
        </Button>
      </section>
      <section className="panel space-y-2 text-sm text-muted-foreground">
        <h2 className="text-foreground">About</h2>
        <p>
          UI motion components from{" "}
          <a href="https://skiper-ui.com" className="underline" target="_blank" rel="noreferrer">
            Skiper UI
          </a>{" "}
          (free tier attribution).
        </p>
        <p>
          <Link href="/onboarding" className="underline">
            Resume onboarding
          </Link>
        </p>
      </section>
    </div>
  );
}
