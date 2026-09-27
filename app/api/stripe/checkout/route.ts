import Stripe from "stripe";
import { checkRateLimit }  from "@/lib/ratelimit";
import { getVerifiedUser } from "@/lib/verify-user";

const PRICE_IDS: Record<string, string> = {
  pro:   "price_1TtHWlRc1DEtwm4Vif6FVkZO",
  elite: "price_1TtHX1Rc1DEtwm4Veb1efu9j",
};
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://sentient-capital.vercel.app";

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Please sign in to upgrade." }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const tier    = String(body?.tier ?? "");
  const priceId = PRICE_IDS[tier];
  if (!priceId) return Response.json({ error: "Invalid plan." }, { status: 400 });

  try {
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" as any });
    const session = await stripe.checkout.sessions.create({
      mode:                 "subscription",
      payment_method_types: ["card"],
      customer_email:       user.email ?? undefined,
      client_reference_id:  user.id,
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          `${SITE_URL}/app?upgraded=true`,
      cancel_url:           `${SITE_URL}/pricing`,
      metadata:             { userId: user.id, tier },
      subscription_data:    { metadata: { userId: user.id, tier } },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }
}
