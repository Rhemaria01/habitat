import { prisma } from "@/lib/db";

export const DEFAULT_CRON_TIME = "0 3 * * *";

/** True when DATABASE_KEEP_ALIVE_ENABLED is "1", "true", or "yes" (case-insensitive). */
export function isDatabaseKeepAliveEnabled(): boolean {
  const raw = process.env.DATABASE_KEEP_ALIVE_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Vercel cron schedule (5-field). Used when generating vercel.json at build. */
export function getCronSchedule(): string {
  const raw = process.env.CRON_TIME?.trim();
  return raw || DEFAULT_CRON_TIME;
}

export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (token.length !== secret.length) {
    return false;
  }
  let out = 0;
  for (let i = 0; i < token.length; i++) {
    out |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return out === 0;
}

/** Lightweight read so hosted Postgres stays active when keep-alive cron is enabled. */
export async function pingDatabase(): Promise<{ ok: true; profileCount: number }> {
  const profileCount = await prisma.profile.count();
  return { ok: true, profileCount };
}
