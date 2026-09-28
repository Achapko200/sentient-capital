import { NextResponse }       from "next/server";
import { fetchMLBStats }      from "@/lib/mlb";
import { calcLiquidity }      from "@/lib/ebay";
import { calcSentiment }      from "@/lib/sentiment";
import { generateSignal }     from "@/lib/cardSignal";
import { getPlayer }          from "@/lib/players";
import { getPriceHistory }    from "@/lib/price-history";
import { getMarketData }      from "@/lib/market-cache";

export async function GET(
  _req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params;
  if (!playerId || !/^\d+$/.test(playerId)) {
    return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
  }

  const player = await getPlayer(playerId);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const [stats, market] = await Promise.all([
    fetchMLBStats(player.id),
    getMarketData(String(player.id), player.cardName),
  ]);

  const sales        = market.listings;
  const avgPrice     = market.price;                 // 0 = no current eBay listings
  const priceHistory = await getPriceHistory(player.id, avgPrice);
  const priceChange  = priceHistory.week.available ? priceHistory.week.changePct : 0;
  const liquidity    = calcLiquidity(sales);
  const sentiment    = calcSentiment(stats, priceChange);
  const cardSignal   = generateSignal(stats, sales, sentiment);

  const { getPSAPopulation } = await import("@/lib/psa-population");
  const psaPopulation = await getPSAPopulation(playerId, player.cardName ?? "", player.name);

  return NextResponse.json({
    player, stats, sales, avgPrice, priceChange, priceHistory,
    hasMarketPrice: avgPrice > 0, marketUpdatedAt: market.updatedAt,
    psaPopulation, liquidity, sentiment, cardSignal,
  });
}
