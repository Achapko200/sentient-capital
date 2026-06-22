// ─── app/api/cards/trade/route.ts ────────────────────────────────────────────

import { placeOrder, cancelOrder } from "@/lib/orderbook";

export async function POST(req: Request) {
  const body = await req.json();
  const { action, cardId, type, price, shares, wallet, orderId } = body;

  if (action === "cancel") {
    const success = cancelOrder(orderId, cardId);
    return Response.json({ success });
  }

  if (!cardId || !type || !price || !shares || !wallet) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const order = placeOrder(cardId, type, parseFloat(price), parseInt(shares), wallet);
  return Response.json({ order });
}