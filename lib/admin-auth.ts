// Admin access: a signed-in user whose email is in ADMIN_EMAILS (comma-separated),
// or a server-to-server call with the private ADMIN_SECRET_KEY (never exposed to browsers).
import { timingSafeEqual } from "crypto";
import { getVerifiedUser } from "@/lib/verify-user";

function secretMatches(given: string | null) {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!given || !expected) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Returns null when allowed, or a 403 response to send back.
export async function requireAdmin(req: Request): Promise<Response | null> {
  if (secretMatches(req.headers.get("x-admin-secret"))) return null;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const user: any = await getVerifiedUser(req);
  const email = String(user?.email ?? "").toLowerCase();
  if (email && admins.includes(email)) return null;
  return Response.json({ error: "Not authorized" }, { status: 403 });
}
