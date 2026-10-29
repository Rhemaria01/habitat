"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Layers,
  ListChecks,
  Settings,
  SunMedium,
  Target,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: "/", label: "Today", icon: SunMedium },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/routines", label: "Routines", icon: Workflow },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/systems", label: "Systems", icon: Layers },
  { href: "/review", label: "Review", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
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
  const mobileLinks = LINKS.filter((l) =>
    ["/", "/habits", "/routines", "/goals", "/review"].includes(l.href),
  );
  return (
    <nav className="tabbar" aria-label="Primary">
      {mobileLinks.map((link) => {
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

export { ThemeToggle } from "@/components/NavTheme";
