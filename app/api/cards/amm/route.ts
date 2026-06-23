// app/api/cards/amm/route.ts
import { getPool, getPrice, calcSellReturn, calcBuyReturn,
         sellToMarket, buyFromMarket, getPriceImpact } from "@/lib/amm";
import { checkRateLimit } from "@/lib/ratelimit";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

// GET — get pool info and price quotes
export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId") ?? "";
  const shares = parseInt(searchParams.get("shares") ?? "1");
  const side   = searchParams.get("side") as "buy" | "sell" ?? "sell";

  if (!cardId || !/^\d+$/.test(cardId)) {
    return Response.json({ error: "Invalid cardId" }, { status: 400 });
  }

  try {
    const pool        = await getPool(cardId);
    const price       = getPrice(pool);
    const sellReturn  = calcSellReturn(pool, shares);
    const buyReturn   = calcBuyReturn(pool, shares * price);
    const impact      = getPriceImpact(pool, shares, side);

    return Response.json({
      price,
      sellReturn,
      buyReturn,
      impact,
      pool: {
        usdcReserve:  pool.usdcReserve,
        shareReserve: pool.shareReserve,
      },
    });
  } catch {
    return Response.json({ error: "Failed to fetch pool" }, { status: 500 });
  }
}

// POST — execute instant buy or sell
export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "trade");
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { action, cardId, wallet, shares, usdcAmount } =
    body as { action?: string; cardId?: string; wallet?: string; shares?: number; usdcAmount?: number };

  if (!cardId || !/^\d+$/.test(cardId)) {
    return Response.json({ error: "Invalid cardId" }, { status: 400 });
  }
  if (!wallet || !WALLET_REGEX.test(wallet)) {
    return Response.json({ error: "Invalid wallet" }, { status: 400 });
  }

  try {
    if (action === "sell") {
      if (!shares || shares < 1 || shares > 100) {
        return Response.json({ error: "Invalid shares" }, { status: 400 });
      }
      const result = await sellToMarket(cardId, wallet, shares);
      return Response.json({ success: true, ...result });
    }

    if (action === "buy") {
      if (!usdcAmount || usdcAmount <= 0) {
        return Response.json({ error: "Invalid USDC amount" }, { status: 400 });
      }
      const result = await buyFromMarket(cardId, wallet, usdcAmount);
      return Response.json({ success: true, ...result });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Trade failed" }, { status: 500 });
  }
}