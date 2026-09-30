// Detects and reacts to attacks: IP bans for admin probing, 2FA brute-force lockout,
// and throttled security alert emails to ADMIN_NOTIFY_EMAIL.
import { Redis }     from "@upstash/redis";
import { sendEmail } from "@/lib/email";

let redis: Redis | null = null;
try {
  const url   = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) redis = new Redis({ url, token });
} catch { redis = null; }

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function clientIP(req: Request) {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip")
      ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

async function bump(key: string, windowSec: number) {
  if (!redis) return 0;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec);
  return n;
}

export async function isBanned(ip: string) {
  if (!redis || ip === "unknown") return false;
  try { return !!(await redis.get(`banned:ip:${ip}`)); } catch { return false; }
}

// One email per alert type per 10 minutes
export async function securityAlert(kind: string, summary: string, details: Record<string, unknown>) {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SUPPORT_EMAIL;
  if (!to) return;
  try { if (redis && !(await redis.set(`sec:alert:${kind}`, "1", { ex: 600, nx: true }))) return; } catch {}
  const rows = Object.entries({ ...details, time: new Date().toUTCString() })
    .map(([k, v]) => `<tr><td style="padding:8px 12px;border:1px solid #EAECF0;color:#667085;font-size:13px;">${esc(k)}</td><td style="padding:8px 12px;border:1px solid #EAECF0;font-size:14px;">${esc(String(v))}</td></tr>`).join("");
  await sendEmail({
    to,
    subject: `Security alert · ${summary}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#B42318;color:#fff;padding:18px 24px;border-radius:10px 10px 0 0;font-weight:700;">Card Tracker · Security alert</div>
      <div style="border:1px solid #EAECF0;border-top:0;padding:24px;border-radius:0 0 10px 10px;">
        <p style="margin:0 0 16px;font-size:15px;color:#101828;">${esc(summary)}</p>
        <table style="border-collapse:collapse;width:100%;">${rows}</table>
        <p style="margin:16px 0 0;font-size:12px;color:#667085;">Automatic protection is already active. Review the admin dashboard if this looks unexpected.</p>
      </div></div>`,
  });
}

// Admin probing: 10 denied attempts from one IP in an hour → 24h ban
export async function recordAdminDenied(req: Request, email?: string) {
  const ip = clientIP(req);
  try {
    const n = await bump(`sec:admin-denied:${ip}`, 3600);
    if (email) await securityAlert("admin-denied", `Account ${email} tried to open the admin area`, { ip, email });
    if (n >= 10 && redis) {
      await redis.set(`banned:ip:${ip}`, "admin-probing", { ex: 86_400 });
      await securityAlert("ip-banned", `IP ${ip} banned for 24 hours after ${n} admin attempts`, { ip, attempts: n });
    }
  } catch {}
}

// 2FA: 5 wrong codes in 15 minutes → locked for the rest of the window
export async function mfaLocked(userId: string) {
  if (!redis) return false;
  try { return Number((await redis.get(`sec:mfa-fail:${userId}`)) ?? 0) >= 5; } catch { return false; }
}
export async function recordMfaFailure(userId: string, email?: string) {
  try {
    const n = await bump(`sec:mfa-fail:${userId}`, 900);
    if (n === 5) await securityAlert("mfa-lockout", `2FA locked for ${email ?? userId} after 5 wrong codes`, { account: email ?? userId });
  } catch {}
}
export async function clearMfaFailures(userId: string) {
  try { await redis?.del(`sec:mfa-fail:${userId}`); } catch {}
}
