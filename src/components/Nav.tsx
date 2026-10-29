"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Download,
  ListChecks,
  Moon,
  Sparkles,
  Sun,
  SunMedium,
  Target,
} from "lucide-react";
import { THEME_COOKIE } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LINKS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: "/", label: "Today", icon: SunMedium },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/routine", label: "Routine", icon: Clock },
  { href: "/guides", label: "Guides", icon: BookOpen },
  { href: "/library", label: "Library", icon: Sparkles },
  { href: "/import", label: "Import", icon: Download },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="side-nav" aria-label="Primary">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn("side-link", active && "active")}
            aria-current={active ? "page" : undefined}
          >
            <link.icon className="size-[18px]" aria-hidden />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Primary">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn("tab-link", active && "active")}
            aria-current={active ? "page" : undefined}
          >
            <link.icon className="size-[18px]" aria-hidden />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ThemeToggle() {
  const router = useRouter();

  function toggle() {
    const isLight = document.documentElement.dataset.theme === "light";
    const next = isLight ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
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
      {/* Both icons render; CSS shows the one matching the active theme. */}
      <Sun className="size-[18px] theme-icon-light" aria-hidden />
      <Moon className="size-[18px] theme-icon-dark" aria-hidden />
    </button>
  );
}
