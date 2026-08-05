import { getWatchlist }                                from "@/lib/players";
import { fetchEbaySales, calcAvgPrice, calcPriceChange,
         calcPriceHistory, calcLiquidity }             from "@/lib/ebay";
import { checkRateLimit }                             from "@/lib/ratelimit";
import { Redis }                                      from "@upstash/redis";

export const revalidate = 0;

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_KEY = "players:enriched";
const CACHE_TTL = 60 * 30; // 30 minutes

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  try {
    // Try cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return Response.json(cached);
    }

    const players = await getWatchlist();
    if (!Array.isArray(players) || players.length === 0) {
      return Response.json([], { status: 200 });
    }

    // Enrich first 12 with eBay prices
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

    const result = [...enriched, ...rest];

    // Cache for 30 minutes
    await redis.set(CACHE_KEY, result, { ex: CACHE_TTL });

    return Response.json(result);
  } catch {
    return Response.json([], { status: 500 });
  }
}
