import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia" as any,
  });

  try {
    const { cardId, playerName, shares, pricePerShare, userId, email } = await req.json();

    if (!cardId || !shares || !pricePerShare || !userId) {
      return Response.json({ error: "Missing params" }, { status: 400 });
    }

    const totalUSD    = Math.round(shares * pricePerShare * 100); // in cents
    const description = `${shares} share${shares > 1 ? "s" : ""} of ${playerName} card`;

    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      customer_email:       email ?? undefined,
      line_items: [{
        quantity:    1,
        price_data: {
          currency:     "usd",
          unit_amount:  totalUSD,
          product_data: {
            name:        description,
            description: `PSA 10 graded card · ${shares} fractional share${shares > 1 ? "s" : ""}`,
          },
        },
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?bought=true&cardId=${cardId}&shares=${shares}&price=${pricePerShare}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/app`,
      metadata:    { cardId, shares: String(shares), pricePerShare: String(pricePerShare), userId, playerName },
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
