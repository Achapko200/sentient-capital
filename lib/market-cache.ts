// Card market data (price, listings, 14-day candles) cached in Supabase.
// Pages read the cache instantly; stale entries refresh from eBay in the background.
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

const EMPTY: MarketData = { status: "unavailable", price: 0, listings: [], candles: [], updatedAt: null, stale: true };
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

// Live eBay lookup -> save to cache (+ daily snapshot). Returns null if eBay was unavailable (cache kept as is).
export function refreshMarketData(playerId: string, cardName: string): Promise<MarketData | null> {
  const key = String(playerId);
  const running = inflight.get(key);
  if (running) return running;

  const job = (async () => {
    const m = await fetchEbayMarket(cardName);
    if (m.status === "unavailable") return null;
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
  const { data } = await supabaseAdmin
    .from("card_market_cache")
    .select("*")
    .eq("player_id", String(playerId))
    .maybeSingle();

  if (data) {
    const cached = fromRow(data);
    if (cached.stale) {
      try { after(() => refreshMarketData(playerId, cardName).then(() => {})); }
      catch { void refreshMarketData(playerId, cardName); }
    }
    return cached;
  }

  // Never looked up before: fetch live once
  return (await refreshMarketData(playerId, cardName)) ?? EMPTY;
}
