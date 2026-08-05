import { getWatchlist }                                     from "@/lib/players";
import { fetchEbaySales, calcAvgPrice, calcPriceChange,
         calcPriceHistory, calcLiquidity }                  from "@/lib/ebay";
import { checkRateLimit }                                   from "@/lib/ratelimit";

export const revalidate = 1800;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  try {
    const players = await getWatchlist();
    if (!Array.isArray(players) || players.length === 0) {
      return Response.json([], { status: 200 });
    }

    // Enrich first 12 players with eBay prices in parallel
    const first12 = players.slice(0, 12);
    const rest     = players.slice(12);

    const enriched = await Promise.all(
      first12.map(async (p) => {
        try {
          const sales        = await fetchEbaySales(p.id, p.cardName);
          const avgPrice     = calcAvgPrice(sales);
          const priceChange  = calcPriceChange(sales);
          const priceHistory = calcPriceHistory(sales);
          const liquidity    = calcLiquidity(sales);
          return { ...p, avgPrice, priceChange, priceHistory, liquidity, sales };
        } catch {
          return { ...p, avgPrice: 0, priceChange: 0 };
        }
      })
    );

    return Response.json([...enriched, ...rest]);
  } catch {
    return Response.json([], { status: 500 });
  }
}
