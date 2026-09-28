import { checkRateLimit } from "@/lib/ratelimit";
import { NextResponse }       from "next/server";
import { fetchMLBStats }      from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice, calcLiquidity } from "@/lib/ebay";
import { calcSentiment }      from "@/lib/sentiment";
import { generateSignal }     from "@/lib/cardSignal";
import { getPlayer }          from "@/lib/players";
import { recordPriceSnapshot, getPriceHistory } from "@/lib/price-history";

// Cache results for 30 minutes
export const revalidate = 1800;

export async function GET(
  req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const { playerId } = await context.params;
  if (!playerId || !/^\d+$/.test(playerId)) {
    return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
  }

  const player = await getPlayer(playerId);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const [stats, sales] = await Promise.all([
    fetchMLBStats(player.id),
    fetchEbaySales(player.id, player.cardName),
  ]);

  const avgPrice = calcAvgPrice(sales);            // 0 = no live eBay listings
  await recordPriceSnapshot(player.id, avgPrice, sales.length);

  const priceHistory = await getPriceHistory(player.id, avgPrice);
  const priceChange  = priceHistory.week.available ? priceHistory.week.changePct : 0;
  const liquidity    = calcLiquidity(sales);
  const sentiment    = calcSentiment(stats, priceChange);
  const cardSignal   = generateSignal(stats, sales, sentiment);

  const { getPSAPopulation } = await import("@/lib/psa-population");
  const psaPopulation = await getPSAPopulation(playerId, player.cardName ?? "", player.name);

  return NextResponse.json({
    player, stats, sales, avgPrice, priceChange, priceHistory,
    hasMarketPrice: avgPrice > 0,
    psaPopulation, liquidity, sentiment, cardSignal,
  });
}
