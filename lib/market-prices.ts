// Latest real eBay price per player. A recent market-cache check is authoritative:
// if it found no base PSA 10 market (price 0), older daily snapshots are ignored.
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
      .select("player_id, price, status, updated_at")
      .gte("updated_at", sinceTs)
      .limit(10000),
  ]);
  if (snaps.error) console.error("[market-prices] snapshots failed:", snaps.error.message);
  if (cache.error) console.error("[market-prices] cache failed:", cache.error.message);

  const latest  = new Map<string, number>();
  const checked = new Set<string>();   // freshly checked by eBay: that result wins
  for (const r of cache.data ?? []) {
    if (r.status === "unavailable") continue;
    checked.add(String(r.player_id));
    if (Number(r.price) > 0) latest.set(String(r.player_id), Number(r.price));
  }
  for (const r of snaps.data ?? []) {
    const id = String(r.player_id);
    if (!checked.has(id) && !latest.has(id)) latest.set(id, Number(r.close));
  }
  return latest;
}
