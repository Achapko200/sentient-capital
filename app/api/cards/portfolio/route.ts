// ─── app/api/cards/portfolio/route.ts ────────────────────────────────────────
import { getUserPositions } from "@/lib/orderbook";
import { getPlayer }        from "@/lib/players";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";
import { priceFromStats }   from "@/lib/cardToken";
import { fetchMLBStats }    from "@/lib/mlb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") ?? "";
  if (!wallet) return Response.json({ positions: [] });

  const positionMap = getUserPositions(wallet);
  const positions = await Promise.all(
    Array.from(positionMap.entries())
      .filter(([, shares]) => shares > 0)
      .map(async ([cardId, shares]) => {
        const player = await getPlayer(cardId);
        if (!player) return null;
        const [stats, sales] = await Promise.all([
          fetchMLBStats(cardId),
          fetchEbaySales(cardId, player.cardName),
        ]);
        const avgCardPrice   = calcAvgPrice(sales) || 150;
        const currentPrice   = priceFromStats(stats, avgCardPrice);
        const avgCost        = currentPrice * 0.92; // approximate — real avg cost from trade history
        const unrealizedPnl  = Math.round((currentPrice - avgCost) * shares * 100) / 100;
        const pnlPct         = Math.round(((currentPrice - avgCost) / avgCost) * 1000) / 10;
        return { cardId, playerName: player.name, cardName: player.cardName, shares, avgCost, currentPrice, unrealizedPnl, pnlPct, cardImage: player.cardImage };
      })
  );

  return Response.json({ positions: positions.filter(Boolean) });
}