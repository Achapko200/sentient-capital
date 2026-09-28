// Latest saved eBay price per player (last few days). Only players with a real PSA 10 market appear.
import { supabaseAdmin } from "@/lib/supabase-server";

const FRESH_DAYS = 3;

export async function getMarketPrices(): Promise<Map<string, number>> {
  const since = new Date(Date.now() - FRESH_DAYS * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("price_snapshots")
    .select("player_id, day, close")
    .gte("day", since)
    .gt("close", 0)
    .order("day", { ascending: false })
    .limit(10000);
  if (error) console.error("[market-prices] query failed:", error.message);
  const latest = new Map<string, number>();
  for (const r of data ?? []) if (!latest.has(r.player_id)) latest.set(r.player_id, Number(r.close));
  return latest;
}
