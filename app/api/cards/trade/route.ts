// ─── app/api/cards/trade/route.ts ────────────────────────────────────────────
import { placeOrder, cancelOrder } from "@/lib/orderbook";
import { TradeSchema }             from "@/lib/validators";
import { checkRateLimit }          from "@/lib/ratelimit";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "trade");
  if (limited) return limited;
  // Legacy crypto trading is disabled: it trusted any wallet address without proof of ownership.
  const notAdmin = await requireAdmin(req);
  if (notAdmin) return Response.json({ error: "This feature is not available." }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TradeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, cardId, type, price, shares, wallet, orderId } = parsed.data;

  try {
    if (action === "cancel") {
      if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });
      const success = await cancelOrder(orderId, wallet);
      return Response.json({ success });
    }

    if (!cardId || !type || !price || !shares) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const order = await placeOrder(cardId, type, price, shares, wallet);
    return Response.json({ order });
  } catch {
    return Response.json({ error: "Trade failed — try again" }, { status: 500 });
  }
}