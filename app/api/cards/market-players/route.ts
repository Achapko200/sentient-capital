// Players that have a real PSA 10 market, most valuable first.
import { getWatchlist }    from "@/lib/players";
import { checkRateLimit }  from "@/lib/ratelimit";
import { getMarketPrices } from "@/lib/market-prices";

export const revalidate = 600;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const [players, prices] = await Promise.all([getWatchlist(), getMarketPrices()]);
  const withMarket = players
    .filter((p: any) => prices.has(String(p.id)))
    .map((p: any) => ({ ...p, marketPrice: prices.get(String(p.id)) }))
    .sort((a: any, b: any) => b.marketPrice - a.marketPrice);

  return Response.json({ players: withMarket, total: players.length, withMarket: withMarket.length });
}
