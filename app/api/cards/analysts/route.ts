import { checkRateLimit } from "@/lib/ratelimit";
import { getWatchlist }  from "@/lib/players";
import { fetchMLBStats } from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";
import { getAnalysis }   from "@/lib/analyst";

export async function GET() {
  try {
    const players = await getWatchlist();

    if (players.length === 0) {
      return Response.json({ analyses: [] });
    }

    const analyses = await Promise.all(
      players.map(async (player) => {
        try {
          // Fetch stats first to estimate card price
          const stats = await fetchMLBStats(player.id);

          const estimatedPrice = stats
            ? Math.round(50 + (stats.hr ?? 0) * 8 + (stats.ops ?? 0) * 200)
            : 150;

          const sales    = await fetchEbaySales(player.id, player.cardName);
          const avgPrice = calcAvgPrice(sales);

          return getAnalysis(player.id, player.name, stats, avgPrice);
        } catch {
          // Don't let one player failure break the whole panel
          return getAnalysis(player.id, player.name, null, 150);
        }
      })
    );

    return Response.json({ analyses });
  } catch {
    return Response.json({ analyses: [] }, { status: 500 });
  }
}