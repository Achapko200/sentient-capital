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
    // Handle one-time card purchase
    if (session.mode === "payment" && session.metadata?.cardId) {
      const { cardId, pricePerShare, userId, playerName } = session.metadata;
      const { supabaseAdmin } = await import("@/lib/supabase-server");

      // Get buyer shipping address from Stripe
      const buyerAddress  = session.shipping_details?.address;
      const buyerName     = session.shipping_details?.name ?? session.customer_details?.name ?? "Buyer";
      const buyerEmail    = session.customer_details?.email ?? "";
      const shippingRate  = session.shipping_cost?.amount_total ?? 999;
      const shippingSpeed = shippingRate > 1000 ? "Express (1-3 days)" : "Standard (3-7 days)";

      const addressStr = buyerAddress
        ? `${buyerAddress.line1}${buyerAddress.line2 ? ", " + buyerAddress.line2 : ""}, ${buyerAddress.city}, ${buyerAddress.state} ${buyerAddress.postal_code}, ${buyerAddress.country}`
        : "Address not provided";

      // Save order to card_orders
      await supabaseAdmin.from("card_orders").insert({
        user_id:           userId,
        player_name:       playerName,
        card_name:         `${playerName} PSA 10`,
        price:             parseFloat(pricePerShare),
        fee:               parseFloat(pricePerShare) * 0.05,
        type:              "buy",
        status:            "paid",
        address:           addressStr,
        stripe_session_id: session.id,
      });

      // Email YOU (admin) with full order details
      if (process.env.RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from:    "Card Tracker <orders@cardtracker.app>",
            to:      ["anna.chapko.2004@gmail.com"],
            subject: `🎉 New Card Sale — ${playerName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>⚾ New Card Sale!</h2>
                <table style="width:100%; border-collapse: collapse;">
                  <tr><td style="padding:8px; border:1px solid #eee;"><strong>Card</strong></td><td style="padding:8px; border:1px solid #eee;">${playerName} PSA 10</td></tr>
                  <tr><td style="padding:8px; border:1px solid #eee;"><strong>Sale Price</strong></td><td style="padding:8px; border:1px solid #eee;">$${pricePerShare}</td></tr>
                  <tr><td style="padding:8px; border:1px solid #eee;"><strong>Your Fee (5%)</strong></td><td style="padding:8px; border:1px solid #eee;">$${(parseFloat(pricePerShare) * 0.05).toFixed(2)}</td></tr>
                  <tr><td style="padding:8px; border:1px solid #eee;"><strong>Buyer</strong></td><td style="padding:8px; border:1px solid #eee;">${buyerName} (${buyerEmail})</td></tr>
                  <tr><td style="padding:8px; border:1px solid #eee;"><strong>Ship To</strong></td><td style="padding:8px; border:1px solid #eee;">${addressStr}</td></tr>
                  <tr><td style="padding:8px; border:1px solid #eee;"><strong>Shipping</strong></td><td style="padding:8px; border:1px solid #eee;">${shippingSpeed}</td></tr>
                </table>
                <p style="margin-top:16px; color:#666;">Go to your admin dashboard to manage this order.</p>
                <a href="https://sentient-capital.vercel.app/admin" style="background:#1a1a2e; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; display:inline-block; margin-top:8px;">View Admin Dashboard</a>
              </div>
            `,
          }),
        });

        // Email BUYER confirmation
        if (buyerEmail) {
          await fetch("https://api.resend.com/emails", {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from:    "Card Tracker <orders@cardtracker.app>",
              to:      [buyerEmail],
              subject: `✅ Order Confirmed — ${playerName} PSA 10`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>⚾ Your order is confirmed!</h2>
                  <p>Thanks for your purchase, ${buyerName}!</p>
                  <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin:16px 0;">
                    <p><strong>Card:</strong> ${playerName} PSA 10</p>
                    <p><strong>Price:</strong> $${pricePerShare}</p>
                    <p><strong>Shipping to:</strong> ${addressStr}</p>
                    <p><strong>Delivery:</strong> ${shippingSpeed}</p>
                  </div>
                  <p>Your card will be shipped once we verify it with our vault. We'll email you a tracking number when it ships.</p>
                  <a href="https://sentient-capital.vercel.app/app" style="background:#2563eb; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; display:inline-block;">Track your order</a>
                </div>
              `,
            }),
          });
        }
      }
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
