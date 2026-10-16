import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token";

export { SESSION_COOKIE };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

export async function signSession(): Promise<string> {
  return signSessionToken(getSecret());
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export function checkAccessKey(key: string): boolean {
  const expected = process.env.ACCESS_KEY;
  if (!expected) {
    throw new Error("ACCESS_KEY is not set");
  }
  if (key.length !== expected.length) return false;
  let out = 0;
  for (let i = 0; i < key.length; i++) {
    out |= key.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return out === 0;
}
