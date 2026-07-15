import { checkRateLimit } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return Response.json({ tier: "free" });

  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data || data.status !== "active") return Response.json({ tier: "free" });
  
  // Check if subscription has expired
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
    // Expire the subscription
    await supabaseAdmin
      .from("subscriptions")
      .update({ tier: "free", status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    return Response.json({ tier: "free" });
  }

  return Response.json({ tier: data.tier, status: data.status, currentPeriodEnd: data.current_period_end });
}

export async function POST(req: Request) {
  const { userId, tier } = await req.json();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      user_id:    userId,
      tier,
      status:     "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
