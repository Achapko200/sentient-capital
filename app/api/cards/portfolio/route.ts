// ─── app/api/cards/portfolio/route.ts ────────────────────────────────────────
import { checkRateLimit } from "@/lib/ratelimit";
import { getUserPositions } from "@/lib/orderbook";
import { getPlayer }        from "@/lib/players";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";
import { priceFromStats }   from "@/lib/cardToken";
import { fetchMLBStats }    from "@/lib/mlb";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") ?? "";

  // Validate wallet format
  if (!wallet || !WALLET_REGEX.test(wallet)) {
    return Response.json({ positions: [] });
  }

  try {
    const userPositions = await getUserPositions(wallet);

    const positions = await Promise.all(
      userPositions
        .filter(({ shares }) => shares > 0)
        .map(async ({ cardId, shares, avgCost }) => {
          try {
            const player = await getPlayer(cardId);
            if (!player) return null;

            // Fetch stats first to estimate price accurately
            const stats = await fetchMLBStats(cardId);

            const estimatedPrice = stats
              ? Math.round(50 + (stats.hr ?? 0) * 8 + (stats.ops ?? 0) * 200)
              : 150;

            const sales        = await fetchEbaySales(cardId, player.cardName);
            const avgCardPrice = calcAvgPrice(sales) || estimatedPrice;
            const currentPrice = priceFromStats(stats, avgCardPrice);

            // avgCost comes from Supabase positions table — real cost basis
            const costBasis     = avgCost > 0 ? avgCost : currentPrice;
            const unrealizedPnl = Math.round((currentPrice - costBasis) * shares * 100) / 100;
            const pnlPct        = costBasis > 0
              ? Math.round(((currentPrice - costBasis) / costBasis) * 1000) / 10
              : 0;

            return {
              cardId,
              playerName:   player.name,
              cardName:     player.cardName,
              shares,
              avgCost:      costBasis,
              currentPrice,
              unrealizedPnl,
              pnlPct,
              cardImage:    player.cardImage,
            };
          } catch {
            return null;
          }
        })
    );

    return Response.json({ positions: positions.filter(Boolean) });
  } catch {
    return Response.json({ positions: [] }, { status: 500 });
  }
}