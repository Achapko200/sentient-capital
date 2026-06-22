import { getWatchlist }  from "@/lib/players";
import { fetchMLBStats } from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";
import { getAnalysis }   from "@/lib/analyst";

export async function GET() {
  const players = await getWatchlist();

  const analyses = await Promise.all(
    players.map(async (player) => {
      const [stats, sales] = await Promise.all([
        fetchMLBStats(player.id),
        fetchEbaySales(player.id, player.cardName),
      ]);
      const avgPrice = calcAvgPrice(sales);
      return getAnalysis(player.id, player.name, stats, avgPrice);
    })
  );

  return Response.json({ analyses });
}