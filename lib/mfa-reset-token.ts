// Signed, expiring token for resetting admin 2FA (HMAC with ADMIN_SECRET_KEY).
import { createHmac, timingSafeEqual } from "crypto";

const key  = () => process.env.ADMIN_SECRET_KEY ?? "";
const sign = (body: string) => createHmac("sha256", key()).update("mfa-reset:" + body).digest("base64url");

export function makeResetToken(userId: string, ttlMs = 15 * 60_000) {
  const body = `${userId}.${Date.now() + ttlMs}`;
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}

export function readResetToken(token: string): string | null {
  const [b, sig] = String(token ?? "").split(".");
  if (!b || !sig || !key()) return null;
  const body = Buffer.from(b, "base64url").toString("utf8");
  const a = Buffer.from(sig), e = Buffer.from(sign(body));
  if (a.length !== e.length || !timingSafeEqual(a, e)) return null;
  const [userId, exp] = body.split(".");
  if (!userId || !(Number(exp) > Date.now())) return null;
  return userId;
}
