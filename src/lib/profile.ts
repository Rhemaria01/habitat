import { prisma } from "@/lib/db";
import { toProfile } from "@/lib/serialize";
import type { Profile } from "@/lib/types";

export async function getOrCreateProfile(): Promise<Profile> {
  const existing = await prisma.profile.findFirst({ orderBy: { created_at: "asc" } });
  if (existing) return toProfile(existing);
  const created = await prisma.profile.create({ data: {} });
  return toProfile(created);
}
