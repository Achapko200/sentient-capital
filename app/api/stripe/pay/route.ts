import Stripe from "stripe";
import { checkRateLimit }  from "@/lib/ratelimit";
import { getVerifiedUser } from "@/lib/verify-user";
import { getPlayer }       from "@/lib/players";
import { getMarketData } from "@/lib/market-cache";

// ── Config ────────────────────────────────────────────────────────────────
const BUYER_FEE       = 0.10;   // 10% fee, shown on the card page
const MAX_SHARES      = 10;
const PRICE_TOLERANCE = 0.05;   // if the price moved >5% since the page loaded, ask the buyer to confirm
const MIN_PRICE_USD   = 1;
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://sentient-capital.vercel.app";
const CARD_ID_RE      = /^\d{1,12}$/;
const IDEMPOTENCY_RE  = /^[A-Za-z0-9_-]{8,100}$/;

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  // Buyer = the signed-in user, never a userId from the request body
  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Please sign in to buy." }, { status: 401 });

  // Anomaly detection on payment
  const { requireContinuousAuth } = await import("@/lib/zero-trust");
  const { authorized, reason } = await requireContinuousAuth(req, user.id, "payment");
  if (!authorized) {
    await (await import("@/lib/audit")).audit("AUTH_FAILURE", user.id, { reason, action: "payment" }, req);
    return Response.json({ error: "Security check failed. Please try again." }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const cardId = String(body?.cardId ?? "");
  if (!CARD_ID_RE.test(cardId)) return Response.json({ error: "Invalid card." }, { status: 400 });

  const shares = Number(body?.shares ?? 1);
  if (!Number.isInteger(shares) || shares < 1 || shares > MAX_SHARES) {
    return Response.json({ error: `You can buy between 1 and ${MAX_SHARES} at a time.` }, { status: 400 });
  }

  // Price is always calculated here, from the same live data as the card page
  const player: any = await getPlayer(cardId);
  if (!player) return Response.json({ error: "Card not found." }, { status: 404 });

  const market = await getMarketData(String(player.id), player.cardName ?? player.name);
  const price  = market.price;
  if (!(price >= MIN_PRICE_USD)) {
    return Response.json({ error: "This card has no current market price, so it can't be bought right now." }, { status: 409 });
  }

  // If the browser showed a different price, don't silently charge a new one
  const expected = Number(body?.expectedPrice ?? body?.pricePerShare);
  if (Number.isFinite(expected) && expected > 0 && Math.abs(expected - price) / price > PRICE_TOLERANCE) {
    return Response.json({
      error: `The market price changed to $${price.toFixed(2)}. Please review the new price and try again.`,
      price,
    }, { status: 409 });
  }

  const feePerShare = Math.round(price * BUYER_FEE * 100) / 100;
  const totalCents  = Math.round((price + feePerShare) * shares * 100);
  const description = `${shares} × ${player.name} PSA 10 card`;

  const idempotencyHeader = req.headers.get("x-idempotency-key");
  const idempotencyKey    = idempotencyHeader && IDEMPOTENCY_RE.test(idempotencyHeader)
    ? `pay:${user.id}:${idempotencyHeader}`
    : undefined;

  try {
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" as any });
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      customer_email:       user.email ?? undefined,
      client_reference_id:  user.id,
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
        quantity:   1,
        price_data: {
          currency:     "usd",
          unit_amount:  totalCents,
          product_data: {
            name:        description,
            description: `Market price $${price.toFixed(2)} + 10% fee $${feePerShare.toFixed(2)} per card`,
          },
        },
      }],
      success_url: `${SITE_URL}/app?bought=true&cardId=${cardId}`,
      cancel_url:  `${SITE_URL}/app`,
      metadata: {
        cardId,
        shares:        String(shares),
        pricePerShare: price.toFixed(2),
        feePerShare:   feePerShare.toFixed(2),
        userId:        user.id,
        playerName:    String(player.name).slice(0, 100),
      },
    }, idempotencyKey ? { idempotencyKey } : undefined);

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/pay] checkout error:", err);
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }
}
