// Admin access: a signed-in user whose email is in ADMIN_EMAILS (comma-separated),
// or a server-to-server call with the private ADMIN_SECRET_KEY (never exposed to browsers).
// Denied attempts are counted; repeated probing bans the IP for 24h and emails you.
import { timingSafeEqual } from "crypto";
import { getVerifiedUser } from "@/lib/verify-user";
import { clientIP, isBanned, recordAdminDenied } from "@/lib/security-guard";

function secretMatches(given: string | null) {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!given || !expected) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Assurance level from the (already signature-verified) Supabase token: "aal2" = passed 2FA
function tokenAal(req: Request): string | null {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const part = m[1].split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(part, "base64").toString("utf8")).aal ?? null;
  } catch { return null; }
}

// Returns null when allowed, or a 403 response to send back.
export async function requireAdmin(req: Request): Promise<Response | null> {
  if (await isBanned(clientIP(req))) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (secretMatches(req.headers.get("x-admin-secret"))) return null;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const user: any = await getVerifiedUser(req);
  const email = String(user?.email ?? "").toLowerCase();
  if (email && admins.includes(email)) {
    // Admin data requires a verified authenticator code, not just a password
    if (process.env.ADMIN_REQUIRE_MFA !== "false" && tokenAal(req) !== "aal2") {
      return Response.json({ error: "mfa_required" }, { status: 403 });
    }
    return null;
  }
  await recordAdminDenied(req, email || undefined);
  return Response.json({ error: "Not authorized" }, { status: 403 });
}
