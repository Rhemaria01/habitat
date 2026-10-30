"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyAppearance,
  readAppearanceFromCookies,
  type AppearanceState,
} from "@/lib/appearance";
import {
  DEFAULT_SETTINGS_PREFERENCES,
  preferencesFromProfile,
  type AccentId,
  type ThemeMode,
} from "@/lib/settings-preferences";
import { useProfileQuery } from "@/hooks/api/use-profile";
import { useUpdateProfileMutation } from "@/hooks/api/use-mutations";

type AppearanceContextValue = {
  themeMode: ThemeMode;
  accent: AccentId;
  setThemeMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentId) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function initialAppearance(): AppearanceState {
  if (typeof document !== "undefined") {
    return readAppearanceFromCookies();
  }
  return {
    theme_mode: DEFAULT_SETTINGS_PREFERENCES.theme_mode,
    accent: DEFAULT_SETTINGS_PREFERENCES.accent,
  };
}

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileQuery = useProfileQuery({ retry: false });
  const updateMutation = useUpdateProfileMutation();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedFromProfile = useRef(false);
  const [appearance, setAppearance] = useState<AppearanceState>(initialAppearance);

  useEffect(() => {
    if (!profileQuery.isSuccess || !profileQuery.data || hydratedFromProfile.current) {
      return;
    }
    const prefs = preferencesFromProfile(profileQuery.data.onboarding ?? {});
    hydratedFromProfile.current = true;
    setAppearance({
      theme_mode: prefs.theme_mode,
      accent: prefs.accent,
    });
  }, [profileQuery.isSuccess, profileQuery.data]);

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    if (appearance.theme_mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyAppearance(appearance);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance]);

  const persist = useCallback(
    (patch: Partial<AppearanceState>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateMutation.mutate({ preferences: patch });
      }, 400);
    },
    [updateMutation],
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setAppearance((prev) => {
        const next = { ...prev, theme_mode: mode };
        applyAppearance(next);
        persist({ theme_mode: mode });
        return next;
      });
    },
    [persist],
  );

  const setAccent = useCallback(
    (accent: AccentId) => {
      setAppearance((prev) => {
        const next = { ...prev, accent };
        applyAppearance(next);
        persist({ accent });
        return next;
      });
    },
    [persist],
  );

  const value = useMemo(
    (): AppearanceContextValue => ({
      themeMode: appearance.theme_mode,
      accent: appearance.accent,
      setThemeMode,
      setAccent,
    }),
    [appearance.theme_mode, appearance.accent, setThemeMode, setAccent],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return ctx;
}
