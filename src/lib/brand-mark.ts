/** Lucide `Leaf` — same paths as sidebar brand in AppShell. */
export const BRAND_LEAF_PATHS = [
  "M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20",
  "M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13",
] as const;

export const BRAND_LEAF_COLOR = "#6fcf9a";
export const BRAND_SURFACE = "#09090b";
export const BRAND_FOREGROUND = "#e8e9df";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3001";
}
