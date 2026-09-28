// Daily: save each player's live eBay PSA 10 price so the market list and price history stay real.
import { getWatchlist }                 from "@/lib/players";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";
import { recordPriceSnapshot }          from "@/lib/price-history";

export const maxDuration = 300;
export const dynamic     = "force-dynamic";
const CONCURRENCY = 8;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const players = await getWatchlist();
  let saved = 0, noData = 0, failed = 0, done = 0;

  for (let i = 0; i < players.length; i += CONCURRENCY) {
    if (Date.now() - started > 280_000) break;          // stop safely before the time limit
    await Promise.all(players.slice(i, i + CONCURRENCY).map(async (p: any) => {
      try {
        const sales = await fetchEbaySales(p.id, p.cardName);
        const price = calcAvgPrice(sales);
        if (price > 0) { await recordPriceSnapshot(p.id, price, sales.length); saved++; }
        else noData++;
      } catch { failed++; }
      done++;
    }));
  }

  console.log(`[cron/snapshot-prices] saved=${saved} noData=${noData} failed=${failed} done=${done}/${players.length}`);
  return Response.json({ saved, noData, failed, done, total: players.length });
}
