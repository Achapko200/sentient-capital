import Stripe from "stripe";

const PRICE_IDS: Record<string, string> = {
  pro:   "price_1TtHWlRc1DEtwm4Vif6FVkZO",
  elite: "price_1TtHX1Rc1DEtwm4Veb1efu9j",
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia" as any,
  });

  try {
    const { tier, userId, email } = await req.json();
    if (!tier || !userId) return Response.json({ error: "Missing params" }, { status: 400 });

    const priceId = PRICE_IDS[tier];
    if (!priceId) return Response.json({ error: "Invalid tier" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode:                 "subscription",
      payment_method_types: ["card"],
      customer_email:       email ?? undefined,
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          `${process.env.NEXT_PUBLIC_SITE_URL}/app?upgraded=true`,
      cancel_url:           `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata:             { userId, tier },
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
