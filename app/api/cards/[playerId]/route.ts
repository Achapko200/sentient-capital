import { NextResponse }       from "next/server";
import { fetchMLBStats }      from "../../../../lib/mlb";
import { fetchEbaySales, calcAvgPrice, calcPriceChange } from "../../../../lib/ebay";
import { calcSentiment }      from "../../../../lib/sentiment";
import { generateSignal }     from "../../../../lib/cardSignal";
import { WATCHLIST }          from "../../../../lib/players";

export async function GET(
  _req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params;
  const player = WATCHLIST.find((p) => p.id === playerId);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const [stats, sales] = await Promise.all([
    fetchMLBStats(player.id),
    fetchEbaySales(player.id, player.cardName),
  ]);

  const avgPrice    = calcAvgPrice(sales);
  const priceChange = calcPriceChange(sales);
  const sentiment   = calcSentiment(stats, priceChange);
  const cardSignal  = generateSignal(stats, sales, sentiment);

  return NextResponse.json({
    player,
    stats,
    sales,
    avgPrice,
    priceChange,
    sentiment,
    cardSignal,
  });
}