/** Edge-safe session token helpers (usable from proxy + Node). */

export const SESSION_COOKIE = "habitat_session";
export const SESSION_VALUE = "habitat-ok";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toHex(sig);
}

export async function signSessionToken(secret: string): Promise<string> {
  const sig = await hmacHex(secret, SESSION_VALUE);
  return `${SESSION_VALUE}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<boolean> {
  if (!token || !secret) return false;
  const [value, sig] = token.split(".");
  if (!value || !sig || value !== SESSION_VALUE) return false;
  const expected = await hmacHex(secret, SESSION_VALUE);
  return timingSafeEqualHex(sig, expected);
}
