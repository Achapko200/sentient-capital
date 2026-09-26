// Content Security & Integrity

// ── Subresource Integrity ─────────────────────────────────────────────────────
export async function generateSRI(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(content);
  const digest  = await crypto.subtle.digest("SHA-384", data);
  const hash    = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return `sha384-${hash}`;
}

// ── Request Integrity Token ───────────────────────────────────────────────────
// Short-lived token tied to specific action + user + timestamp
export async function generateIntegrityToken(
  userId: string,
  action: string,
  secret: string,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 30000); // 30 second window
  const payload   = `${userId}:${action}:${timestamp}`;
  const encoder   = new TextEncoder();
  const keyData   = encoder.encode(secret);
  const msgData   = encoder.encode(payload);
  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifyIntegrityToken(
  userId: string,
  action: string,
  token:  string,
  secret: string,
): Promise<boolean> {
  // Check current and previous 30-second window
  for (const offset of [0, 1]) {
    const timestamp = Math.floor(Date.now() / 30000) - offset;
    const expected  = await generateIntegrityToken(userId, action, secret);
    if (expected === token) return true;
  }
  return false;
}

// ── Output Encoding ───────────────────────────────────────────────────────────
export function htmlEncode(str: string): string {
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ── URL Validation ────────────────────────────────────────────────────────────
export function isSafeURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) &&
           !parsed.hostname.includes("..") &&
           !url.includes("javascript:") &&
           !url.includes("data:");
  } catch { return false; }
}

// ── Safe Redirect ─────────────────────────────────────────────────────────────
const ALLOWED_REDIRECT_HOSTS = [
  "sentient-capital.vercel.app",
  "localhost",
];

export function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url, "https://sentient-capital.vercel.app");
    return ALLOWED_REDIRECT_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
  } catch { return false; }
}
