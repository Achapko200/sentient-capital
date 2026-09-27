import { timingSafeEqual }  from "crypto";
import { checkRateLimit }   from "@/lib/ratelimit";
import { supabaseAdmin }    from "@/lib/supabase-server";
import { getVerifiedUser }  from "@/lib/verify-user";

const GRACE_MS      = 3 * 24 * 60 * 60 * 1000; // allow webhook lag at renewal
const PAID_STATUSES = new Set(["active", "trialing"]);
const TIERS         = ["free", "pro", "elite"] as const;

// GET: the signed-in user's own plan
export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ tier: "free" });

  // Older callers pass ?userId= — it must match the signed-in user
  const requested = new URL(req.url).searchParams.get("userId");
  if (requested && requested !== user.id) return Response.json({ tier: "free" });

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/subscription] lookup failed:", error);
    return Response.json({ tier: "free" });
  }
  if (!data || !PAID_STATUSES.has(String(data.status))) return Response.json({ tier: "free" });

  // Only expire well after the period ended, so a delayed renewal webhook can't downgrade a paying user
  if (data.current_period_end && new Date(data.current_period_end).getTime() + GRACE_MS < Date.now()) {
    await supabaseAdmin
      .from("subscriptions")
      .update({ tier: "free", status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return Response.json({ tier: "free" });
  }

  return Response.json({ tier: data.tier, status: data.status, currentPeriodEnd: data.current_period_end });
}

// POST: internal only — set a user's tier (requires x-internal-secret)
function secretMatches(provided: string | null): boolean {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  if (!secretMatches(req.headers.get("x-internal-secret"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { userId, tier } = body ?? {};
  if (typeof userId !== "string" || !userId) return Response.json({ error: "Missing userId" }, { status: 400 });
  if (!TIERS.includes(tier)) return Response.json({ error: "Invalid tier" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert({ user_id: userId, tier, status: "active", updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) {
    console.error("[api/subscription] upsert failed:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
  return Response.json({ success: true });
}
