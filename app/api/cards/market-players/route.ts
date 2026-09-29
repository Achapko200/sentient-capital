// Every player whose PSA 10 card has a real current eBay price, most valuable first.
// Includes players outside the watchlist (e.g. retired stars someone searched for and opened).
import { getWatchlist, getPlayer } from "@/lib/players";
import { checkRateLimit }          from "@/lib/ratelimit";
import { getMarketPrices }         from "@/lib/market-prices";

export const revalidate = 300;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const [players, prices] = await Promise.all([getWatchlist(), getMarketPrices()]);
  const known  = new Set(players.map((p: any) => String(p.id)));
  const extraIds = [...prices.keys()].filter(id => !known.has(id)).slice(0, 300);
  const extras = (await Promise.all(extraIds.map(id => getPlayer(id)))).filter(Boolean) as any[];

  const marketPlayers = [...players, ...extras]
    .filter((p: any) => (prices.get(String(p.id)) ?? 0) > 0)
    .map((p: any) => {
      const marketPrice = prices.get(String(p.id))!;
      return { ...p, marketPrice, avgPrice: marketPrice };
    })
    .sort((a: any, b: any) => b.marketPrice - a.marketPrice);

  return Response.json({ players: marketPlayers, total: players.length + extras.length, withMarket: marketPlayers.length });
}
