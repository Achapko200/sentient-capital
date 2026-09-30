// Push notifications. "subscribe" = signed-in user registers their own device.
// "notify" = server-only (price-alert job), authenticated with CRON_SECRET.
import { timingSafeEqual } from "crypto";
import { checkRateLimit }  from "@/lib/ratelimit";
import { supabaseAdmin }   from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verify-user";

export const dynamic = "force-dynamic";

function isServerCall(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? ""), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function send(subscription: any, payload: string) {
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(`mailto:${process.env.VAPID_EMAIL}`, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  return webpush.sendNotification(subscription, payload);
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }

  if (body?.action === "subscribe") {
    const user: any = await getVerifiedUser(req);
    if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });
    const mine   = [user.id, user.email ? `email:${user.email}` : null].filter(Boolean);
    const userId = mine.includes(body.userId) ? body.userId : user.id;
    const sub    = body.subscription;
    if (!sub || typeof sub.endpoint !== "string" || !sub.endpoint.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth
        || JSON.stringify(sub).length > 4000) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("push_subscriptions")
      .upsert({ user_id: userId, subscription: JSON.stringify(sub), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) return Response.json({ error: "Could not save subscription" }, { status: 500 });
    return Response.json({ success: true });
  }

  if (body?.action === "notify") {
    if (!isServerCall(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
    const { data } = await supabaseAdmin.from("push_subscriptions").select("subscription").eq("user_id", String(body.userId ?? "")).maybeSingle();
    if (!data) return Response.json({ error: "No subscription" }, { status: 404 });
    const url = typeof body.url === "string" && body.url.startsWith("/") ? body.url : "/app";
    await send(JSON.parse(data.subscription), JSON.stringify({
      title: String(body.title ?? "Card Tracker").slice(0, 120),
      body:  String(body.body ?? "").slice(0, 300),
      url,
    }));
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
