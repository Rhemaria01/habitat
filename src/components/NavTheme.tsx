"use client";

import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { applyThemeMode } from "@/lib/theme-prefs";

export function ThemeToggle() {
  const router = useRouter();

  function toggle() {
    const isLight = document.documentElement.dataset.theme === "light";
    const next = isLight ? "dark" : "light";
    applyThemeMode(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
    >
      <Sun className="size-[18px] theme-icon-light" aria-hidden />
      <Moon className="size-[18px] theme-icon-dark" aria-hidden />
    </button>
  );
}
