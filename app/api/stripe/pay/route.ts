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
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "JP", "SG", "MX", "DE", "FR", "IT", "ES", "NL", "BR", "IN"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type:         "fixed_amount",
            fixed_amount: { amount: 999, currency: "usd" },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type:         "fixed_amount",
            fixed_amount: { amount: 1999, currency: "usd" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
      line_items: [{
        quantity:    1,
        price_data: {
          currency:     "usd",
          unit_amount:  totalUSD,
          product_data: {
            name:        description,
            description: `PSA 10 graded baseball card`,
          },
        },
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?bought=true&cardId=${cardId}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/app`,
      metadata:    { cardId, shares: String(shares), pricePerShare: String(pricePerShare), userId, playerName },
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
