import { cn } from "@/lib/utils";
import { isHabitEmoji } from "@/lib/habit-emojis";
import { habitIconComponent } from "@/lib/habit-icons";

type HabitIconProps = {
  icon: string | null | undefined;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "size-8 text-base [&_svg]:size-4",
  md: "size-11 text-lg [&_svg]:size-5",
  lg: "size-14 text-xl [&_svg]:size-7",
};

export function HabitIcon({ icon, color, className, size = "md" }: HabitIconProps) {
  const shellStyle = {
    background: color
      ? `color-mix(in srgb, ${color} 22%, transparent)`
      : "color-mix(in srgb, var(--primary) 18%, transparent)",
    color: color ?? "var(--primary-bright)",
  };

  if (isHabitEmoji(icon)) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl border border-border leading-none",
          SIZE[size],
          className,
        )}
        style={shellStyle}
        aria-hidden
      >
        {icon}
      </span>
    );
  }

  const Icon = habitIconComponent(icon);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-border",
        SIZE[size],
        className,
      )}
      style={shellStyle}
      aria-hidden
    >
      <Icon className="size-[1em]" strokeWidth={2} />
    </span>
  );
}
