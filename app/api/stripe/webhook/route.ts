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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // Handle one-time card purchase (not subscription)
    if (session.mode === "payment" && session.metadata?.cardId) {
      const { cardId, shares, pricePerShare, userId, playerName } = session.metadata;
      const { supabaseAdmin } = await import("@/lib/supabase-server");
      
      // Add shares to user portfolio
      const wallet = `stripe:${userId}`;
      const existing = await supabaseAdmin
        .from("positions")
        .select()
        .eq("wallet", wallet)
        .eq("card_id", cardId)
        .single();

      if (existing.data) {
        const totalShares = existing.data.shares + parseInt(shares);
        const avgCost     = ((existing.data.avg_cost * existing.data.shares) + (parseFloat(pricePerShare) * parseInt(shares))) / totalShares;
        await supabaseAdmin.from("positions")
          .update({ shares: totalShares, avg_cost: avgCost })
          .eq("wallet", wallet).eq("card_id", cardId);
      } else {
        await supabaseAdmin.from("positions")
          .insert({ wallet, card_id: cardId, shares: parseInt(shares), avg_cost: parseFloat(pricePerShare) });
      }

      // Record trade
      await supabaseAdmin.from("trades").insert({
        id:          `trd_stripe_${Date.now()}`,
        card_id:     cardId,
        price:       parseFloat(pricePerShare),
        shares:      parseInt(shares),
        buy_wallet:  wallet,
        sell_wallet: "platform",
        executed_at: new Date().toISOString(),
      });
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
