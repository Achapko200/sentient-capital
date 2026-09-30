// Two-factor (authenticator app). Every action applies ONLY to the signed-in user.
// The stored secret is never returned after setup; codes are checked on the server.
import QRCode from "qrcode";
import { checkRateLimit }  from "@/lib/ratelimit";
import { generateSecret, verifyTotp } from "@/lib/mfa";
import { supabaseAdmin }   from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verify-user";
import { mfaLocked, recordMfaFailure, clearMfaFailures } from "@/lib/security-guard";

export const dynamic = "force-dynamic";
const formatSecret = (s: string) => s.match(/.{1,4}/g)?.join(" ") ?? s;

async function me(req: Request) {
  const u: any = await getVerifiedUser(req);
  return u?.id ? u : null;
}
async function settings(userId: string) {
  const { data } = await supabaseAdmin.from("mfa_settings").select("enabled, method, secret").eq("user_id", userId).maybeSingle();
  return data;
}
const publicStatus = (s: any) => ({ enabled: !!s?.enabled, method: s?.enabled ? s?.method ?? null : null, secret: null });

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  const user = await me(req);
  if (!user) return Response.json({ ...publicStatus(null), error: "Please sign in again." }, { status: 401 });
  return Response.json(publicStatus(await settings(user.id)));
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;
  const user = await me(req);
  if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });

  let payload: any;
  try { payload = await req.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  const action = payload?.action;

  if (action === "status") return Response.json(publicStatus(await settings(user.id)));

  if (action === "totp") {
    const current = await settings(user.id);
    if (current?.enabled) return Response.json({ error: "Two-factor authentication is already on." }, { status: 409 });
    const secret = generateSecret();
    const { error } = await supabaseAdmin.from("mfa_settings")
      .upsert({ user_id: user.id, enabled: false, method: "app", secret }, { onConflict: "user_id" });
    if (error) return Response.json({ error: "Could not start setup" }, { status: 500 });
    const label  = encodeURIComponent(`CardTracker:${user.email ?? user.id}`);
    const otpUri = `otpauth://totp/${label}?secret=${secret}&issuer=CardTracker&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = await QRCode.toDataURL(otpUri, { margin: 1, width: 180 });   // generated here, never sent to a third party
    return Response.json({ success: true, secret, otpUri, qrCodeUrl, setupCode: formatSecret(secret) });
  }

  if (action === "sms") {
    return Response.json({ error: "Text-message codes aren't available. Please use an authenticator app." }, { status: 501 });
  }

  if (action === "verify") {
    const code = String(payload?.code ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) return Response.json({ success: false, error: "Enter the 6-digit code." }, { status: 400 });
    const s = await settings(user.id);
    if (!s?.secret) return Response.json({ success: false, error: "Start two-factor setup first." }, { status: 400 });
    if (await mfaLocked(user.id)) return Response.json({ success: false, error: "Too many wrong codes. Try again in 15 minutes." }, { status: 429 });
    const ok = verifyTotp(s.secret, code);
    if (ok) await clearMfaFailures(user.id); else await recordMfaFailure(user.id, user.email);
    return Response.json({ success: ok });
  }

  if (action === "enable") {
    const s = await settings(user.id);
    if (!s?.secret) return Response.json({ error: "Start two-factor setup first." }, { status: 400 });
    const code = payload?.code ? String(payload.code).replace(/\s/g, "") : "";
    if (await mfaLocked(user.id)) return Response.json({ error: "Too many wrong codes. Try again in 15 minutes." }, { status: 429 });
    if (code ? !verifyTotp(s.secret, code) : payload?.secret !== s.secret) {
      if (code) await recordMfaFailure(user.id, user.email);
      return Response.json({ error: "Setup could not be confirmed. Please start again." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("mfa_settings").update({ enabled: true, method: "app" }).eq("user_id", user.id);
    if (error) return Response.json({ error: "Could not enable two-factor" }, { status: 500 });
    return Response.json({ success: true });
  }

  return Response.json({ error: "Unsupported action" }, { status: 400 });
}
