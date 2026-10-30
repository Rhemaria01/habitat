import type { AccentId } from "@/lib/settings-preferences";

export type ResolvedTheme = "dark" | "light";

/** Canonical accent paint tokens — keep globals.css [data-accent] blocks aligned. */
export type AccentPaint = {
  primary: string;
  primaryBright: string;
  sidebarPrimary: string;
};

export const ACCENT_PAINT: Record<
  AccentId,
  Record<ResolvedTheme, AccentPaint>
> = {
  green: {
    dark: {
      primary: "#8fa992",
      primaryBright: "#8fa992",
      sidebarPrimary: "#8fa992",
    },
    light: {
      primary: "#6d8770",
      primaryBright: "#4d634f",
      sidebarPrimary: "#6d8770",
    },
  },
  purple: {
    dark: {
      primary: "#a898c4",
      primaryBright: "#b8a8e8",
      sidebarPrimary: "#a898c4",
    },
    light: {
      primary: "#8a7a9e",
      primaryBright: "#6d5a82",
      sidebarPrimary: "#8a7a9e",
    },
  },
  blue: {
    dark: {
      primary: "#9ba8c4",
      primaryBright: "#9ba8c4",
      sidebarPrimary: "#9ba8c4",
    },
    light: {
      primary: "#7a8799",
      primaryBright: "#5a6575",
      sidebarPrimary: "#7a8799",
    },
  },
  orange: {
    dark: {
      primary: "#c4a574",
      primaryBright: "#c4a574",
      sidebarPrimary: "#c4a574",
    },
    light: {
      primary: "#a8884a",
      primaryBright: "#886a32",
      sidebarPrimary: "#a8884a",
    },
  },
  pink: {
    dark: {
      primary: "#c4908f",
      primaryBright: "#d4a8a7",
      sidebarPrimary: "#c4908f",
    },
    light: {
      primary: "#a86d6c",
      primaryBright: "#8a5251",
      sidebarPrimary: "#a86d6c",
    },
  },
  teal: {
    dark: {
      primary: "#8eb5b8",
      primaryBright: "#8eb5b8",
      sidebarPrimary: "#8eb5b8",
    },
    light: {
      primary: "#6a9598",
      primaryBright: "#4d7578",
      sidebarPrimary: "#6a9598",
    },
  },
};

export function accentSwatchColor(id: AccentId): string {
  return ACCENT_PAINT[id].dark.primary;
}

export function isAccentId(value: string | undefined): value is AccentId {
  return (
    value === "green" ||
    value === "purple" ||
    value === "blue" ||
    value === "orange" ||
    value === "pink" ||
    value === "teal"
  );
}
