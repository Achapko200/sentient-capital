// Latest real eBay price per player: newest of the daily snapshots (last 3 days)
// and the per-card market cache. Only players with a real PSA 10 market appear.
import { supabaseAdmin } from "@/lib/supabase-server";

const FRESH_DAYS = 3;

export async function getMarketPrices(): Promise<Map<string, number>> {
  const sinceDay = new Date(Date.now() - FRESH_DAYS * 86_400_000).toISOString().slice(0, 10);
  const sinceTs  = new Date(Date.now() - FRESH_DAYS * 86_400_000).toISOString();

  const [snaps, cache] = await Promise.all([
    supabaseAdmin.from("price_snapshots")
      .select("player_id, day, close")
      .gte("day", sinceDay).gt("close", 0)
      .order("day", { ascending: false })
      .limit(10000),
    supabaseAdmin.from("card_market_cache")
      .select("player_id, price, updated_at")
      .gte("updated_at", sinceTs).gt("price", 0)
      .limit(10000),
  ]);
  if (snaps.error) console.error("[market-prices] snapshots failed:", snaps.error.message);
  if (cache.error) console.error("[market-prices] cache failed:", cache.error.message);

  const latest = new Map<string, number>();
  // Cache is refreshed more often, so it wins; snapshots fill the rest
  for (const r of cache.data ?? []) latest.set(String(r.player_id), Number(r.price));
  for (const r of snaps.data ?? []) if (!latest.has(String(r.player_id))) latest.set(String(r.player_id), Number(r.close));
  return latest;
}
