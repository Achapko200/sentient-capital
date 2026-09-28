// Card market data (price, listings, 14-day candles) cached in Supabase.
// Pages read the cache instantly; stale entries refresh from eBay in the background.
// If eBay is unavailable (rate limit / outage), fall back to the last saved daily price.
import { after }                from "next/server";
import { supabaseAdmin }        from "@/lib/supabase-server";
import { fetchEbayMarket, type ListingCandle } from "@/lib/ebay";
import { recordPriceSnapshot }  from "@/lib/price-history";
import type { EbaySale }        from "@/lib/cardTypes";

const FRESH_MS = 30 * 60 * 1000;

export type MarketData = {
  status:    "available" | "no_listings" | "unavailable";
  price:     number;
  listings:  EbaySale[];
  candles:   ListingCandle[];
  updatedAt: string | null;
  stale:     boolean;
};

const inflight = new Map<string, Promise<MarketData | null>>();

function fromRow(row: any): MarketData {
  const age = Date.now() - new Date(row.updated_at).getTime();
  return {
    status:    row.status,
    price:     Number(row.price) || 0,
    listings:  Array.isArray(row.listings) ? row.listings : [],
    candles:   Array.isArray(row.candles) ? row.candles : [],
    updatedAt: row.updated_at,
    stale:     age > FRESH_MS,
  };
}

// Last saved daily price, used only when eBay can't be reached
async function lastSavedPrice(playerId: string): Promise<MarketData> {
  const { data } = await supabaseAdmin
    .from("price_snapshots")
    .select("close, day")
    .eq("player_id", String(playerId))
    .gt("close", 0)
    .order("day", { ascending: false })
    .limit(1);
  const row = data?.[0];
  return {
    status:    "unavailable",
    price:     row ? Number(row.close) || 0 : 0,
    listings:  [],
    candles:   [],
    updatedAt: row ? `${row.day}T00:00:00Z` : null,
    stale:     true,
  };
}

// Live eBay lookup -> save to cache (+ daily snapshot). Returns null if eBay was unavailable (cache untouched).
export function refreshMarketData(playerId: string, cardName: string): Promise<MarketData | null> {
  const key = String(playerId);
  const running = inflight.get(key);
  if (running) return running;

  const job = (async () => {
    const m = await fetchEbayMarket(cardName);
    if (m.status === "unavailable") {
      console.warn(`[market-cache] eBay unavailable for ${key}`);
      return null;
    }
    const row = {
      player_id: key, card_name: cardName, price: m.price,
      listings: m.listings, candles: m.candles, status: m.status, updated_at: m.checkedAt,
    };
    const { error } = await supabaseAdmin.from("card_market_cache").upsert(row, { onConflict: "player_id" });
    if (error) console.error("[market-cache] save failed:", error.message);
    if (m.price > 0) await recordPriceSnapshot(key, m.price, m.listings.length);
    return fromRow(row);
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}

export async function getMarketData(playerId: string, cardName: string): Promise<MarketData> {
  const { data, error } = await supabaseAdmin
    .from("card_market_cache")
    .select("*")
    .eq("player_id", String(playerId))
    .maybeSingle();
  if (error) console.error("[market-cache] read failed:", error.message);

  if (data) {
    const cached = fromRow(data);
    if (cached.stale) {
      try { after(() => refreshMarketData(playerId, cardName).then(() => {})); }
      catch { void refreshMarketData(playerId, cardName); }
    }
    return cached;
  }

  // Never cached: try eBay once, else show the last saved price instead of $0
  return (await refreshMarketData(playerId, cardName)) ?? (await lastSavedPrice(playerId));
}
