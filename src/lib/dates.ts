/** Local YYYY-MM-DD helpers (avoid UTC off-by-one). */

/** Fixed locale so server render and client hydration always match. */
export const LOCALE = "en-GB";

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, delta: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function daysBetween(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Inclusive list of YYYY-MM-DD keys from start through end. */
export function eachDayKey(startKey: string, endKey: string): string[] {
  if (endKey < startKey) return [];
  const keys: string[] = [];
  for (let cursor = startKey; cursor <= endKey; cursor = addDays(cursor, 1)) {
    keys.push(cursor);
  }
  return keys;
}

/** Monday-based week start key containing the given date. */
export function weekStartKey(key: string): string {
  const date = parseDateKey(key);
  const shift = (date.getDay() + 6) % 7; // Sunday=6, Monday=0 … Saturday=5
  date.setDate(date.getDate() - shift);
  return toDateKey(date);
}

export function formatLongDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function startOfYear(year: number): string {
  return `${year}-01-01`;
}

export function endOfYear(year: number): string {
  return `${year}-12-31`;
}
