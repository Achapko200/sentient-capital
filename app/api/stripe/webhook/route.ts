import Stripe           from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia" as any,
  });

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId  = session.metadata?.userId;
    const tier    = session.metadata?.tier;
    if (userId && tier) {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id:                userId,
        tier,
        status:                 "active",
        stripe_customer_id:     session.customer,
        stripe_subscription_id: session.subscription,
        current_period_end:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at:             new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .single();
    if (data) {
      await supabaseAdmin
        .from("subscriptions")
        .update({ tier: "free", status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", data.user_id);
    }
  }

  return Response.json({ received: true });
}
