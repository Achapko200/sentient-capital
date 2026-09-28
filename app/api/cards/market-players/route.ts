// Return the full tracked player market, with currently priced cards first.
import { getWatchlist }    from "@/lib/players";
import { checkRateLimit }  from "@/lib/ratelimit";
import { getMarketPrices } from "@/lib/market-prices";

export const revalidate = 600;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const [players, prices] = await Promise.all([getWatchlist(), getMarketPrices()]);
  const marketPlayers = players
    .map((p: any) => {
      const marketPrice = prices.get(String(p.id)) ?? null;
      return { ...p, marketPrice, avgPrice: marketPrice ?? 0 };
    })
    .sort((a: any, b: any) => (b.marketPrice ?? 0) - (a.marketPrice ?? 0));

  return Response.json({
    players: marketPlayers,
    total: marketPlayers.length,
    withMarket: marketPlayers.filter((p: any) => p.marketPrice !== null).length,
  });
}
