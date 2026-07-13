import { NextResponse }       from "next/server";
import { fetchMLBStats }      from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice, calcPriceChange, calcPriceHistory, calcLiquidity } from "@/lib/ebay";
import { calcSentiment }      from "@/lib/sentiment";
import { generateSignal }     from "@/lib/cardSignal";
import { getPlayer }          from "@/lib/players";

export async function GET(
  _req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params;

  // Validate playerId — digits only
  if (!playerId || !/^\d+$/.test(playerId)) {
    return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
  }

  const player = await getPlayer(playerId);
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Fetch stats first so we can estimate card price for mock eBay sales
  const stats = await fetchMLBStats(player.id);

  const estimatedPrice = stats
    ? Math.round(50 + (stats.hr ?? 0) * 8 + (stats.ops ?? 0) * 200)
    : 150;

  const sales = await fetchEbaySales(player.id, player.cardName);

  const avgPrice     = calcAvgPrice(sales);
  const priceChange  = calcPriceChange(sales);
  const priceHistory = calcPriceHistory(sales);
  const liquidity    = calcLiquidity(sales); // ← count, not playerId
  const sentiment    = calcSentiment(stats, priceChange);
  const cardSignal   = generateSignal(stats, sales, sentiment);

  return NextResponse.json({
    player,
    stats,
    sales,
    avgPrice,
    priceChange,
    priceHistory,
    liquidity,
    sentiment,
    cardSignal,
  });
}