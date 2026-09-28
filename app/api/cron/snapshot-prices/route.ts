// Refreshes cached eBay market data for EVERY player, every day, in 6 runs (?part=0..5).
// Cards with a known market get a full check; others a quick one-page check.
// Stops if eBay refuses, or if the day's eBay usage passes CRON_BUDGET (keeps room for users).
import { getWatchlist }      from "@/lib/players";
import { getMarketPrices }   from "@/lib/market-prices";
import { refreshMarketData } from "@/lib/market-cache";
import { getEbayUsage }      from "@/lib/ebay-budget";

export const maxDuration = 300;
export const dynamic     = "force-dynamic";

const PARTS            = 6;
const CONCURRENCY      = 4;
const STOP_AFTER_FAILS = 8;
const TIME_BUDGET_MS   = 280_000;
const CRON_BUDGET      = Number(process.env.EBAY_CRON_BUDGET ?? 3000);

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partParam = new URL(req.url).searchParams.get("part");
  const part      = partParam === null ? null : Number(partParam);
  if (part !== null && !(Number.isInteger(part) && part >= 0 && part < PARTS)) {
    return Response.json({ error: "Invalid part" }, { status: 400 });
  }

  const started = Date.now();
  const [players, known] = await Promise.all([getWatchlist(), getMarketPrices()]);
  const todo = players
    .filter((p: any) => part === null || Number(p.id) % PARTS === part)
    .sort((a: any, b: any) => Number(known.has(String(b.id))) - Number(known.has(String(a.id))));

  let saved = 0, noData = 0, unavailable = 0, done = 0, fails = 0;
  let stopReason: string | null = null;

  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    if (Date.now() - started > TIME_BUDGET_MS) { stopReason = "time"; break; }
    if (fails >= STOP_AFTER_FAILS)            { stopReason = "ebay_refusing"; break; }
    const { used } = await getEbayUsage();
    if (used >= CRON_BUDGET)                  { stopReason = `budget (${used} calls today)`; break; }

    await Promise.all(todo.slice(i, i + CONCURRENCY).map(async (p: any) => {
      const hasMarket = known.has(String(p.id));
      try {
        const m = await refreshMarketData(String(p.id), p.cardName, hasMarket ? 3 : 1);
        if (!m)               { unavailable++; fails++; }
        else if (m.price > 0) { saved++;  fails = 0; }
        else                  { noData++; fails = 0; }
      } catch { unavailable++; fails++; }
      done++;
    }));
  }

  const usage   = await getEbayUsage();
  const summary = { part, saved, noData, unavailable, done, todo: todo.length, stopReason, ebayCallsToday: usage.used, seconds: Math.round((Date.now() - started) / 1000) };
  console.log("[cron/snapshot-prices]", JSON.stringify(summary));
  return Response.json(summary);
}
