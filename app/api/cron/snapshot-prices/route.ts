// Daily: refresh cached eBay market data. Cards with a market every day; everyone else once a week (1/7 per day).
import { getWatchlist }      from "@/lib/players";
import { getMarketPrices }   from "@/lib/market-prices";
import { refreshMarketData } from "@/lib/market-cache";

export const maxDuration = 300;
export const dynamic     = "force-dynamic";
const CONCURRENCY = 4;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const [players, known] = await Promise.all([getWatchlist(), getMarketPrices()]);
  const today   = new Date().getUTCDay();
  const todo    = players.filter((p: any) => known.has(String(p.id)) || Number(p.id) % 7 === today);
  let saved = 0, noData = 0, unavailable = 0, done = 0;

  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    if (Date.now() - started > 280_000) break;
    await Promise.all(todo.slice(i, i + CONCURRENCY).map(async (p: any) => {
      try {
        const m = await refreshMarketData(String(p.id), p.cardName);
        if (!m) unavailable++;
        else if (m.price > 0) saved++;
        else noData++;
      } catch { unavailable++; }
      done++;
    }));
  }

  console.log(`[cron/snapshot-prices] saved=${saved} noData=${noData} unavailable=${unavailable} done=${done}/${todo.length}`);
  return Response.json({ saved, noData, unavailable, done, todo: todo.length, totalPlayers: players.length });
}
