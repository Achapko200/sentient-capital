import { checkRateLimit }  from "@/lib/ratelimit";
import { getWatchlist }    from "@/lib/players";
import { fetchMLBStats }   from "@/lib/mlb";
import { getAnalysis }     from "@/lib/analyst";
import { getMarketPrices } from "@/lib/market-prices";

export const revalidate = 1800;
const MAX_PLAYERS = 40;

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  try {
    const [players, prices] = await Promise.all([getWatchlist(), getMarketPrices()]);
    const priced = players
      .filter((p: any) => (prices.get(String(p.id)) ?? 0) > 0)
      .sort((a: any, b: any) => prices.get(String(b.id))! - prices.get(String(a.id))!)
      .slice(0, MAX_PLAYERS);
    const analyses = await Promise.all(priced.map(async (p: any) => {
      const price = prices.get(String(p.id))!;
      try { return getAnalysis(p.id, p.name, await fetchMLBStats(p.id), price); }
      catch { return getAnalysis(p.id, p.name, null, price); }
    }));
    return Response.json({ analyses });
  } catch {
    return Response.json({ analyses: [] }, { status: 500 });
  }
}
