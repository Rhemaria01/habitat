import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Server-side Prisma client (PostgreSQL via the pg driver adapter).
 * Created lazily on first query so module import never requires DATABASE_URL
 * (build-time page data collection, tests), and cached on globalThis so
 * Next.js hot reloads don't spawn extra connection pools.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** Invalidate cached client when the Prisma schema changes (dev HMR). */
  prismaRevision?: number;
};

/** Increment when `prisma/schema.prisma` changes. */
const PRISMA_CLIENT_REVISION = 1;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaRevision === PRISMA_CLIENT_REVISION
  ) {
    return globalForPrisma.prisma;
  }
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaRevision = PRISMA_CLIENT_REVISION;
  return globalForPrisma.prisma;
}

/** Lazy proxy: forwards property access to the real client on first use. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
