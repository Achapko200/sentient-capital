// app/api/cards/orders/route.ts
import { getUserOrders } from "@/lib/orderbook";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId") ?? "";
  const wallet = searchParams.get("wallet") ?? "";

  if (!cardId || !/^\d+$/.test(cardId)) {
    return Response.json({ orders: [] });
  }
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return Response.json({ orders: [] });
  }

  try {
    const orders = await getUserOrders(cardId, wallet);
    return Response.json({ orders });
  } catch {
    return Response.json({ orders: [] }, { status: 500 });
  }
}