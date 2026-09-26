// Enterprise-grade cryptographic utilities

// ── HMAC Request Signing ──────────────────────────────────────────────────────
export async function signRequest(payload: string, secret: string): Promise<string> {
  const enc     = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(payload);

  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await signRequest(payload, secret);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// ── Secure Token Generation ───────────────────────────────────────────────────
export function generateSecureToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Session Fingerprint ───────────────────────────────────────────────────────
export async function generateSessionFingerprint(req: Request): Promise<string> {
  const ua      = req.headers.get("user-agent") ?? "";
  const lang    = req.headers.get("accept-language") ?? "";
  const encoding= req.headers.get("accept-encoding") ?? "";
  const data    = `${ua}|${lang}|${encoding}`;
  const hash    = await signRequest(data, process.env.ADMIN_SECRET_KEY ?? "default");
  return hash.slice(0, 16);
}

// ── PII Scrubber ──────────────────────────────────────────────────────────────
export function scrubPII(obj: Record<string, any>): Record<string, any> {
  const PII_FIELDS = ["password", "ssn", "creditCard", "cardNumber", "cvv", "pin",
                      "secret", "token", "apiKey", "privateKey", "accessToken"];
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (PII_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      result[key] = "[REDACTED]";
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = scrubPII(result[key]);
    }
  }
  return result;
}

// ── Data Masking ──────────────────────────────────────────────────────────────
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***@***.***";
  return `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`;
}

export function maskIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  return "***";
}
