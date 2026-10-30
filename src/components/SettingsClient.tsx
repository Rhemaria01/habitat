"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  Info,
  LogOut,
  Palette,
  Settings2,
  Database,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import {
  QueryErrorBanner,
  SettingsFormSkeleton,
} from "@/components/api/QueryLoading";
import { useProfileQuery } from "@/hooks/api/use-profile";
import {
  useClearUserDataMutation,
  useExportUserDataMutation,
  useImportUserDataMutation,
  useUpdateProfileMutation,
} from "@/hooks/api/use-mutations";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { ThemeModeSwitcher } from "@/components/ThemeModeSwitcher";
import {
  ACCENT_SWATCHES,
  REMINDER_TIME_OPTIONS,
  preferencesFromProfile,
  type SettingsPreferences,
} from "@/lib/settings-preferences";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/components/AppearanceProvider";
import { formatTimezoneLabel, listTimezones } from "@/lib/theme-prefs";

const APP_VERSION = "0.1.0";
const IDENTITY_MAX = 200;

type SettingsClientProps = {
  profile: Profile;
};

export function SettingsClient({ profile: initial }: SettingsClientProps) {
  const {
    data: profile = initial,
    isLoading,
    isError,
    error,
  } = useProfileQuery({ initialData: initial });

  const updateMutation = useUpdateProfileMutation();
  const exportMutation = useExportUserDataMutation();
  const importMutation = useImportUserDataMutation();
  const clearMutation = useClearUserDataMutation();

  const savedPrefs = useMemo(
    () => preferencesFromProfile(profile.onboarding ?? {}),
    [profile.onboarding],
  );

  const [identityDraft, setIdentityDraft] = useState<string | null>(null);
  const identityNote = identityDraft ?? profile.identity_note ?? "";

  const [prefOverrides, setPrefOverrides] = useState<
    Partial<SettingsPreferences>
  >({});
  const prefs: SettingsPreferences = { ...savedPrefs, ...prefOverrides };

  const { accent, setAccent } = useAppearance();

  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timezones = useMemo(() => listTimezones(), []);
  const pending =
    updateMutation.isPending ||
    exportMutation.isPending ||
    importMutation.isPending ||
    clearMutation.isPending;

  const scheduleProfileSave = useCallback(
    (patch: {
      timezone?: string;
      week_start?: number;
      identity_note?: string | null;
    }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateMutation.mutate(patch);
      }, 400);
    },
    [updateMutation],
  );

  const schedulePrefsSave = useCallback(
    (patch: Partial<SettingsPreferences>) => {
      if (prefsTimer.current) clearTimeout(prefsTimer.current);
      prefsTimer.current = setTimeout(() => {
        updateMutation.mutate({ preferences: patch });
      }, 400);
    },
    [updateMutation],
  );

  function patchPrefs(patch: Partial<SettingsPreferences>) {
    setPrefOverrides((prev) => ({ ...prev, ...patch }));
    schedulePrefsSave(patch);
  }

  function onAccentPick(accentId: Parameters<typeof setAccent>[0]) {
    setAccent(accentId);
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

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      importMutation.mutate(text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="settings-page relative">
      {isLoading ? <SettingsFormSkeleton /> : null}
      {isError ? <QueryErrorBanner error={error} /> : null}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={onImportFile}
      />

      <div className={cn("settings-grid", isLoading && "sr-only")}>
        <SettingsCard icon={Settings2} title="Preferences">
          <div className="settings-field">
            <Label className="settings-field-label" htmlFor="settings-tz">
              Timezone
            </Label>
            <Select
              value={profile.timezone}
              onValueChange={(value) => {
                scheduleProfileSave({ timezone: value });
              }}
            >
              <SelectTrigger id="settings-tz" className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {formatTimezoneLabel(tz)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="settings-field">
            <span className="settings-field-label">Week starts on</span>
            <ToggleGroup
              type="single"
              value={String(profile.week_start)}
              onValueChange={(value) => {
                if (!value) return;
                scheduleProfileSave({ week_start: Number(value) });
              }}
              className="w-full"
            >
              <ToggleGroupItem value="0" className="flex-1">
                Sunday
              </ToggleGroupItem>
              <ToggleGroupItem value="1" className="flex-1">
                Monday
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="settings-field">
            <Label className="settings-field-label" htmlFor="settings-identity">
              Identity / values note
            </Label>
            <div className="settings-textarea-wrap">
              <Textarea
                id="settings-identity"
                value={identityNote}
                maxLength={IDENTITY_MAX}
                rows={3}
                placeholder="Who you're becoming…"
                onChange={(e) => {
                  const next = e.target.value.slice(0, IDENTITY_MAX);
                  setIdentityDraft(next);
                }}
                onBlur={() => {
                  const trimmed = identityNote.trim() || null;
                  scheduleProfileSave({ identity_note: trimmed });
                  setIdentityDraft(null);
                }}
              />
              <span className="settings-char-count">
                {identityNote.length}/{IDENTITY_MAX}
              </span>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard icon={Palette} title="Appearance">
          <div className="settings-field">
            <span className="settings-field-label">Theme</span>
            <ThemeModeSwitcher variant="settings" />
          </div>

          <div className="settings-field">
            <span className="settings-field-label">Accent color</span>
            <div className="settings-accent-row">
              {ACCENT_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  className={cn(
                    "settings-accent-swatch",
                    accent === swatch.id && "active",
                  )}
                  style={{ backgroundColor: swatch.color }}
                  aria-label={swatch.label}
                  aria-pressed={accent === swatch.id}
                  onClick={() => onAccentPick(swatch.id)}
                >
                  {accent === swatch.id ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard icon={Database} title="Data">
          <div className="settings-row">
            <div className="settings-row-copy">
              <div className="settings-row-label">Export data</div>
              <p>Download all habits and logs as JSON.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="settings-data-btn"
              disabled={pending}
              onClick={exportData}
            >
              {exportMutation.isPending ? "Exporting…" : "Export JSON"}
            </Button>
          </div>
          <div className="settings-row">
            <div className="settings-row-copy">
              <div className="settings-row-label">Import data</div>
              <p>Restore from a Habitat export file.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="settings-data-btn"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              {importMutation.isPending ? "Importing…" : "Import JSON"}
            </Button>
          </div>
          <div className="settings-row">
            <div className="settings-row-copy">
              <div className="settings-row-label">Clear all data</div>
              <p>Permanently delete all habits and logs.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="settings-data-btn text-destructive hover:text-destructive"
                  disabled={pending}
                >
                  Delete data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all habit data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes every habit and log. Your profile and settings
                    stay. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => clearMutation.mutate(undefined)}
                  >
                    Delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SettingsCard>

        <SettingsCard icon={Bell} title="Reminders">
          <div className="settings-row">
            <div className="settings-row-copy">
              <div className="settings-row-label">Daily reminder</div>
              <p>Get a nudge to check in on your habits.</p>
            </div>
            <Switch
              checked={prefs.daily_reminder}
              onCheckedChange={(checked) =>
                patchPrefs({ daily_reminder: checked })
              }
              aria-label="Daily reminder"
            />
          </div>
          <div className="settings-field">
            <Label className="settings-field-label" htmlFor="settings-reminder-time">
              Reminder time
            </Label>
            <Select
              value={prefs.reminder_time}
              disabled={!prefs.daily_reminder}
              onValueChange={(value) => patchPrefs({ reminder_time: value })}
            >
              <SelectTrigger id="settings-reminder-time" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TIME_OPTIONS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="settings-row">
            <div className="settings-row-copy">
              <div className="settings-row-label">Weekly summary</div>
              <p>A recap of your week every Sunday.</p>
            </div>
            <Switch
              checked={prefs.weekly_summary}
              onCheckedChange={(checked) =>
                patchPrefs({ weekly_summary: checked })
              }
              aria-label="Weekly summary"
            />
          </div>
        </SettingsCard>

        <SettingsCard icon={Info} title="About">
          <p className="settings-about-version">Habitat v{APP_VERSION}</p>
          <p className="settings-about-text">
            UI motion components from{" "}
            <a
              href="https://skiper-ui.com"
              target="_blank"
              rel="noreferrer"
            >
              Skiper UI
            </a>{" "}
            (free tier attribution).
          </p>
        </SettingsCard>

        <SettingsCard icon={LogOut} title="Sign out">
          <form action={logoutAction}>
            <button type="submit" className="settings-signout-btn">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </SettingsCard>
      </div>
    </div>
  );
}
