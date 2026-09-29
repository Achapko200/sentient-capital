// Players whose PSA 10 card has a real current eBay price, most valuable first.
// Players without a market are left out (they can still be found via search).
import { getWatchlist }    from "@/lib/players";
import { checkRateLimit }  from "@/lib/ratelimit";
import { getMarketPrices } from "@/lib/market-prices";

export const revalidate = 300;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const [players, prices] = await Promise.all([getWatchlist(), getMarketPrices()]);
  const marketPlayers = players
    .filter((p: any) => (prices.get(String(p.id)) ?? 0) > 0)
    .map((p: any) => {
      const marketPrice = prices.get(String(p.id))!;
      return { ...p, marketPrice, avgPrice: marketPrice };
    })
    .sort((a: any, b: any) => b.marketPrice - a.marketPrice);

  return Response.json({
    players:      marketPlayers,
    total:        players.length,
    withMarket:   marketPlayers.length,
  });
}
