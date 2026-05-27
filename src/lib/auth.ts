const SESSION_COOKIE = "crm_session";
const SECRET = process.env.SESSION_SECRET ?? "changeme-replace-in-production-32c";
const EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 horas

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const payload = JSON.stringify({ username, exp: Date.now() + EXPIRY_MS });
  const enc = new TextEncoder();
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return btoa(payload) + "." + sigB64;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;
    const payload = atob(payloadB64);
    const { username, exp } = JSON.parse(payload);
    if (Date.now() > exp) return null;
    const key = await getKey();
    const enc = new TextEncoder();
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
    return valid ? username : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
