"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppearance } from "@/components/AppearanceProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_MODE_OPTIONS } from "@/lib/theme-mode-options";
import type { ThemeMode } from "@/lib/settings-preferences";
import { cn } from "@/lib/utils";

const THEME_ICONS: Record<ThemeMode, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

function themeLabel(mode: ThemeMode): string {
  return THEME_MODE_OPTIONS.find((o) => o.id === mode)?.label ?? mode;
}

type ThemeModeSwitcherProps = {
  variant: "settings" | "sidebar" | "toolbar";
};

function ThemeModeMenuItems() {
  const { themeMode, setThemeMode } = useAppearance();

  return (
    <DropdownMenuRadioGroup
      value={themeMode}
      onValueChange={(value) => setThemeMode(value as ThemeMode)}
    >
      {THEME_MODE_OPTIONS.map(({ id, label }) => {
        const Icon = THEME_ICONS[id];
        return (
          <DropdownMenuRadioItem key={id} value={id}>
            <Icon className="size-4 opacity-80" aria-hidden />
            {label}
          </DropdownMenuRadioItem>
        );
      })}
    </DropdownMenuRadioGroup>
  );
}

function SidebarThemeMenu() {
  const { themeMode } = useAppearance();
  const TriggerIcon = THEME_ICONS[themeMode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Theme: ${themeLabel(themeMode)}`}
          title={`Theme: ${themeLabel(themeMode)}`}
        >
          <TriggerIcon className="size-[18px]" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="side-theme-menu min-w-[9.5rem]"
      >
        <ThemeModeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeModeSwitcher({ variant }: ThemeModeSwitcherProps) {
  const { themeMode, setThemeMode } = useAppearance();

  if (variant === "sidebar") {
    return <SidebarThemeMenu />;
  }

  const isSettings = variant === "settings";

  return (
    <div
      className={cn(
        isSettings && "settings-theme-grid",
        variant === "toolbar" && "toolbar-theme-switch",
      )}
      role="group"
      aria-label="Theme"
    >
      {THEME_MODE_OPTIONS.map(({ id, label }) => {
        const Icon = THEME_ICONS[id];
        const active = themeMode === id;

        return (
          <button
            key={id}
            type="button"
            className={cn(
              isSettings && "settings-theme-tile",
              variant === "toolbar" && "toolbar-theme-option",
              active && "active",
            )}
            onClick={() => setThemeMode(id)}
            aria-pressed={active}
            aria-label={label}
            title={label}
          >
            <Icon
              className={cn(isSettings ? "size-5" : "size-3.5")}
              aria-hidden
            />
            {isSettings ? <span>{label}</span> : null}
            {isSettings && active ? (
              <Check className="size-3.5 text-primary" aria-hidden />
            ) : null}
            {!isSettings ? <span className="sr-only">{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
