// Detects and reacts to attacks: IP bans for admin credential probing, 2FA brute-force lockout,
// and throttled, professional security alert emails to ADMIN_NOTIFY_EMAIL.
import { Redis }     from "@upstash/redis";
import { sendEmail } from "@/lib/email";

let redis: Redis | null = null;
try {
  const url   = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) redis = new Redis({ url, token });
} catch { redis = null; }

const APP_URL = "https://sentient-capital.vercel.app";
const BRAND   = "#1E1A4D";
const FONT    = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
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

// ── Professional alert email ────────────────────────────────────────────────
type Severity = "High" | "Medium";
type Alert = {
  kind: string; severity: Severity; title: string;
  happened: string; action: string; next: string;
  details: Record<string, unknown>;
};

const SEV = {
  High:   { bg: "#FEF3F2", border: "#FECDCA", text: "#B42318" },
  Medium: { bg: "#FFFAEB", border: "#FEDF89", text: "#B54708" },
};

function alertHtml(a: Alert) {
  const s = SEV[a.severity];
  const when = new Date().toLocaleString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";
  const rows = Object.entries({ ...a.details, Detected: when }).map(([k, v], i, arr) =>
    `<tr><td style="padding:11px 16px;${i < arr.length - 1 ? "border-bottom:1px solid #EAECF0;" : ""}font-size:13px;color:#667085;width:140px;">${esc(k)}</td>
         <td style="padding:11px 16px;${i < arr.length - 1 ? "border-bottom:1px solid #EAECF0;" : ""}font-size:14px;color:#101828;font-weight:500;font-family:${k === "IP address" ? "ui-monospace,Menlo,monospace" : FONT};">${esc(String(v))}</td></tr>`).join("");
  const section = (label: string, body: string) => `
      <p style="margin:26px 0 8px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#475467;">${label}</p>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#344054;">${body}</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(a.title)}. ${esc(a.action)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:40px 12px;"><tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border:1px solid #E4E7EC;border-radius:14px;overflow:hidden;">
    <tr><td style="background:${BRAND};padding:22px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><img src="${APP_URL}/email/logo/white" width="196" height="48" alt="Card Tracker" style="display:block;border:0;"></td>
        <td align="right" style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#C7C4F2;">Security</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:4px;background:${s.text};font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td style="padding:34px 36px 30px;">
      <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${s.bg};border:1px solid ${s.border};font-size:12px;font-weight:700;color:${s.text};">${a.severity} severity · Security alert</span>
      <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-0.3px;color:#101828;">${esc(a.title)}</h1>
      ${section("What happened", esc(a.happened))}
      ${section("What we did", esc(a.action))}
      ${section("What you should do", esc(a.next))}
      <p style="margin:26px 0 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#475467;">Details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EAECF0;border-radius:10px;border-collapse:separate;">${rows}</table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="border-radius:8px;background:${BRAND};">
        <a href="${APP_URL}/admin" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">Open Admin Dashboard</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:22px 36px;background:#F9FAFB;border-top:1px solid #EAECF0;">
      <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#667085;">This is an automated message from Card Tracker's security monitoring. Similar alerts are grouped and sent at most once every 10 minutes.</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#98A2B3;">&copy; ${new Date().getFullYear()} Card Tracker &middot; Confidential &middot; Do not forward</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export async function securityAlert(a: Alert) {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SUPPORT_EMAIL;
  if (!to) return;
  try { if (redis && !(await redis.set(`sec:alert:${a.kind}`, "1", { ex: 600, nx: true }))) return; } catch {}
  await sendEmail({ to, subject: `[${a.severity}] Security alert: ${a.title}`, html: alertHtml(a) });
}

// ── Admin probing ───────────────────────────────────────────────────────────
// Only attempts that present a credential count (anonymous requests are already harmless).
// 10 such attempts from one IP in an hour → 24h ban.
export async function recordAdminDenied(req: Request, email?: string) {
  const presentedCredential = !!(req.headers.get("authorization") || req.headers.get("x-admin-secret"));
  if (!presentedCredential) return;
  const ip = clientIP(req);
  try {
    if (email) await securityAlert({
      kind: "admin-denied", severity: "Medium",
      title: "Non-admin account tried to access the admin area",
      happened: `The signed-in account ${email} requested admin data. This account is not on the admin list.`,
      action: "The request was refused. No data was shared.",
      next: "If you recognize this account and it should have access, add it to ADMIN_EMAILS in Vercel. Otherwise no action is needed.",
      details: { Account: email, "IP address": ip },
    });
    const n = await bump(`sec:admin-denied:${ip}`, 3600);
    if (n >= 10 && redis) {
      await redis.set(`banned:ip:${ip}`, "admin-probing", { ex: 86_400 });
      await securityAlert({
        kind: "ip-banned", severity: "High",
        title: "IP address blocked after repeated admin attempts",
        happened: `${n} failed attempts to access the admin area were made from one IP address within an hour, each using a login or secret that was not authorized.`,
        action: "This IP address has been blocked from the admin area for 24 hours. The block lifts automatically.",
        next: "No action is needed if you don't recognize this activity. If it was you or your team, the block lifts on its own after 24 hours.",
        details: { "IP address": ip, Attempts: n, "Blocked for": "24 hours" },
      });
    }
  } catch {}
}

// ── 2FA: 5 wrong codes in 15 minutes → locked for the rest of the window ────
export async function mfaLocked(userId: string) {
  if (!redis) return false;
  try { return Number((await redis.get(`sec:mfa-fail:${userId}`)) ?? 0) >= 5; } catch { return false; }
}
export async function recordMfaFailure(userId: string, email?: string) {
  try {
    const n = await bump(`sec:mfa-fail:${userId}`, 900);
    if (n === 5) await securityAlert({
      kind: "mfa-lockout", severity: "High",
      title: "Two-factor verification locked after repeated wrong codes",
      happened: `Five incorrect two-factor codes were entered for ${email ?? "an account"} within 15 minutes.`,
      action: "Two-factor verification for this account is paused for 15 minutes to stop code guessing.",
      next: "If this wasn't the account owner, their password may be known to someone else. Ask them to change it.",
      details: { Account: email ?? userId },
    });
  } catch {}
}
export async function clearMfaFailures(userId: string) {
  try { await redis?.del(`sec:mfa-fail:${userId}`); } catch {}
}
