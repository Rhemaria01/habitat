const LIGHT_INK = "#202321";

export function normalizeHex(color: string): string | null {
  const c = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase();
  }
  return null;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const linear = ([rgb.r, rgb.g, rgb.b] as const).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** White or near-black body text for a solid background hex. */
export function contrastTextOn(background: string): typeof LIGHT_INK | "#ffffff" {
  return relativeLuminance(background) > 0.179 ? LIGHT_INK : "#ffffff";
}

export function mixHex(fg: string, bg: string, fgRatio: number): string {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return normalizeHex(bg) ?? LIGHT_INK;
  const t = Math.min(1, Math.max(0, fgRatio));
  const mix = (x: number, y: number) => Math.round(x * t + y * (1 - t));
  const r = mix(a.r, b.r);
  const g = mix(a.g, b.g);
  const bl = mix(a.b, b.b);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function mutedFromSolid(fg: string, alpha = 0.72): string {
  const rgb = hexToRgb(fg);
  if (!rgb) return fg;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

const SURFACE = {
  dark: "#313834",
  light: "#f2f3eb",
} as const;

/** Approximate scrim over cover photos (dark enough for light text). */
const COVER_SCRIM = "#1a1f1c";

export function habitCardContrastStyle(
  habitColor: string,
  options: { coverImage: boolean; theme: "light" | "dark" },
): Record<`--${string}`, string> {
  const onHabit = contrastTextOn(habitColor);

  if (options.coverImage) {
    const fg = contrastTextOn(COVER_SCRIM);
    return {
      "--habit-card-fg": fg,
      "--habit-card-muted": mutedFromSolid(fg, 0.72),
      "--habit-on-fg": onHabit,
    };
  }

  const surface = SURFACE[options.theme];
  const cardBg = mixHex(habitColor, surface, 0.24);
  const fg = contrastTextOn(cardBg);

  return {
    "--habit-card-bg": cardBg,
    "--habit-card-fg": fg,
    "--habit-card-muted": mutedFromSolid(fg, 0.68),
    "--habit-on-fg": onHabit,
  };
}
