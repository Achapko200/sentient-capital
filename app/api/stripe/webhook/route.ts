import Stripe           from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;
    const userId  = session.metadata?.userId;
    const tier    = session.metadata?.tier;
    if (userId && tier) {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id:                userId,
        tier,
        status:                 "active",
        stripe_customer_id:     session.customer as string,
        stripe_subscription_id: session.subscription as string,
        current_period_end:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at:             new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
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
