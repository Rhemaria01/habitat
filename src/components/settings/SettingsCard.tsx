"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsCardProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsCard({
  icon: Icon,
  title,
  children,
  className,
}: SettingsCardProps) {
  return (
    <section className={cn("settings-card glass-panel", className)}>
      <div className="settings-card-head">
        <div className="settings-card-icon" aria-hidden>
          <Icon className="size-[18px]" />
        </div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
