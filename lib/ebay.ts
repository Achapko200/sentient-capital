// ─── lib/ebay.ts ─────────────────────────────────────────────────────────────
// Live eBay data for PSA 10 cards. Uses the Browse API, which returns ACTIVE LISTINGS
// (asking prices), not completed sales. Nothing here is simulated: if eBay has no
// data, callers get an empty list and should show "no data".
import type { EbaySale } from "@/lib/cardTypes";

const SEARCH_LIMIT = 50;
const MAX_RESULTS  = 20;
const EXCLUDE_RE   = /\b(lot|lots|bundle|reprint|custom|rp|digital|pick|you pick|mystery|break)\b/i;

let ebayToken: string | null = null;
let tokenExpiry: number      = 0;
const MIN_REQUEST_GAP_MS = 250;
let lastEbayRequestAt = 0;

async function throttleEbayRequest() {
  const now = Date.now();
  const elapsed = now - lastEbayRequestAt;
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP_MS - elapsed));
  }
  lastEbayRequestAt = Date.now();
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 1): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await throttleEbayRequest();
      const res = await fetch(url, init);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const waitMs = 1000 * (attempt + 1) * 2;
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
    }
  }

  throw lastError ?? new Error(`eBay request failed for ${url}`);
}

async function getEbayToken(): Promise<string | null> {
  if (ebayToken && Date.now() < tokenExpiry) return ebayToken;

  const appId  = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) return null;

  try {
    const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
    const res = await fetchWithRetry("https://api.ebay.com/identity/v1/oauth2/token", {
      method:  "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type":  "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    });
    if (!res.ok) {
      console.error("[ebay] token request failed:", res.status);
      return null;
    }
    const data  = await res.json();
    ebayToken   = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return ebayToken;
  } catch (err) {
    console.error("[ebay] token error:", err);
    return null;
  }
}

type Found = { id: string; title: string; price: number; created: Date | null };

const PAGE_SIZE   = 200;
const SUFFIX_RE   = /^(jr\.?|sr\.?|ii|iii|iv)$/i;
const NOISE_RE    = /^(psa|10|rookie|rc|card|graded|gem|mint)$/i;
// Parallels, numbered, autos and relics are different cards with very different prices
const PARALLEL_RE = /(auto|autograph|autographed|patch|relic|jersey)/i;

function normalizeText(value: string) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// "Aaron Judge 2016 Topps Chrome Rookie PSA 10" -> name "Aaron Judge", set ["topps","chrome"], rookie true
function parseCardName(cardName: string) {
  const words    = String(cardName ?? "").split(/\s+/).filter(Boolean);
  const name     = words.slice(0, 2).join(" ");
  const lastName = (words[1] ?? words[0] ?? "").toLowerCase();
  const setWords = words.slice(2)
    .filter(w => !/^\d{4}$/.test(w) && !NOISE_RE.test(w) && !SUFFIX_RE.test(w))
    .map(w => normalizeText(w));
  const rookie   = /\b(rookie|rc)\b/i.test(cardName ?? "");
  return { name, lastName, setWords, rookie };
}

// Real PSA 10 listings of this specific card. null = eBay unavailable.
async function searchPSA10(
  cardName: string,
  opts: { sort?: string; maxPages?: number; until?: number } = {},
): Promise<Found[] | null> {
  const token = await getEbayToken();
  if (!token) { console.warn("[ebay] no API token - returning no data"); return null; }

  const { name, lastName, setWords, rookie } = parseCardName(cardName);
  if (!name) return [];

  const queries = [
    [name, ...setWords, "PSA 10"],
    [name, "PSA 10"],
    [name, ...setWords.slice(0, Math.min(2, setWords.length)), "PSA 10"],
  ].map(parts => encodeURIComponent(parts.filter(Boolean).join(" ")));

  const filter = encodeURIComponent("buyingOptions:{FIXED_PRICE},priceCurrency:USD");
  const sort   = opts.sort ? `&sort=${opts.sort}` : "";
  const out: Found[] = [];

  for (const query of queries) {
    for (let page = 0; page < (opts.maxPages ?? 1); page++) {
      try {
        const res = await fetchWithRetry(
          `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&category_ids=261328&filter=${filter}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}${sort}`,
          { headers: { "Authorization": `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US", "Content-Type": "application/json" } }
        );
        if (!res.ok) { console.error("[ebay] search failed:", res.status); return page === 0 ? null : out; }
        const data  = await res.json();
        const items: any[] = data.itemSummaries ?? [];

        for (const it of items) {
          const rawTitle = String(it.title ?? "");
          const t = normalizeText(rawTitle);
          const hasPsa10 = t.includes("psa 10") || t.includes("psa10");
          const hasLastName = !lastName || t.includes(lastName) || normalizeText(name).includes(lastName);
          if (!hasPsa10 || !hasLastName || EXCLUDE_RE.test(rawTitle)) continue;

          const setHasWords = setWords.length === 0 || setWords.some(word => t.includes(word));
          const rookieMatch = !rookie || /\b(rc|rookie)\b/.test(t) || /(rc|rookie)\b/.test(normalizeText(cardName));
          if (!setHasWords || !rookieMatch) {
            const fallbackNameMatch = normalizeText(name).split(" ").every(token => t.includes(token) || token.length <= 2);
            if (!fallbackNameMatch) continue;
          }
          if (PARALLEL_RE.test(rawTitle)) continue; // base card only

          const price = parseFloat(it.price?.value ?? "0");
          if (!Number.isFinite(price) || price <= 0) continue;
          const title = String(it.title);
          out.push({ id: String(it.itemId), title, price, created: it.itemCreationDate ? new Date(it.itemCreationDate) : null });
        }

        const oldest = items.length ? new Date(items[items.length - 1]?.itemCreationDate ?? 0).getTime() : 0;
        if (items.length < PAGE_SIZE) break;
        if (opts.until && oldest && oldest < opts.until) break;
      } catch (err) {
        console.error("[ebay] error:", err);
        return page === 0 ? null : out;
      }
    }
    if (out.length > 0) break;
  }
  return out;
}

export type EbayMarketSnapshot = {
  listings: EbaySale[];
  status: "available" | "no_listings" | "unavailable";
  checkedAt: string;
};

// Returns current PSA 10 listings with an explicit status, so callers can tell
// a verified empty market from an API outage.
export async function fetchEbayMarketSnapshot(cardName: string): Promise<EbayMarketSnapshot> {
  const found = await searchPSA10(cardName, { sort: "newlyListed" });
  const checkedAt = new Date().toISOString();
  if (!found) return { listings: [], status: "unavailable", checkedAt };
  const listings = found
    .sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0))
    .slice(0, MAX_RESULTS)
    .map(f => ({
      id:        f.id,
      date:      f.created ? f.created.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Active",
      price:     f.price,
      condition: "PSA 10",
      title:     f.title,
    }));
  return {
    listings,
    status: listings.length > 0 ? "available" : "no_listings",
    checkedAt,
  };
}

// Returns current PSA 10 listings for the card, newest first.
export async function fetchEbaySales(
  playerId: string,
  cardName: string,
): Promise<EbaySale[]> {
  const live = (await fetchEbayMarketSnapshot(cardName)).listings;
  if (live.length > 0) return live;

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { data, error } = await supabaseAdmin
      .from("price_snapshots")
      .select("player_id, close, day")
      .eq("player_id", String(playerId))
      .gt("close", 0)
      .order("day", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const latest = Number(data[0].close);
      if (Number.isFinite(latest) && latest > 0) {
        return [{
          id: `cached-${playerId}-${data[0].day}`,
          date: String(data[0].day),
          price: latest,
          condition: "PSA 10",
          title: `Cached live eBay asking price for ${cardName}`,
        }];
      }
    }
  } catch {
    // ignore cache fallback failures; real eBay data should still surface when available
  }

  return [];
}

export type ListingCandle = {
  time: number; timestamp: number; date: string;
  open: number; high: number; low: number; close: number; volume: number;
};

const candleCache = new Map<string, { at: number; data: ListingCandle[] }>();
const CANDLE_TTL  = 30 * 60 * 1000;

// Real 14-day chart: each candle = asking prices of this card's PSA 10 listings posted that day.
export async function fetchNewListingCandles(cardName: string, days = 14): Promise<ListingCandle[]> {
  const key    = `${cardName}|${days}`;
  const cached = candleCache.get(key);
  if (cached && Date.now() - cached.at < CANDLE_TTL) return cached.data;

  const cutoff = Date.now() - days * 86_400_000;
  const found  = await searchPSA10(cardName, { sort: "newlyListed", maxPages: 5, until: cutoff });
  if (!found) return [];

  const recent = found
    .filter(f => f.created && f.created.getTime() >= cutoff)
    .sort((a, b) => a.created!.getTime() - b.created!.getTime());

  let candles: ListingCandle[] = [];
  if (recent.length) {
    const sorted = recent.map(f => f.price).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const clean  = recent.filter(f => f.price <= median * 3 && f.price >= median / 3);

    const byDay = new Map<string, Found[]>();
    for (const f of clean) {
      const d = f.created!.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      if (!byDay.has(d)) byDay.set(d, []);
      byDay.get(d)!.push(f);
    }
    candles = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, list]) => {
        const prices = list.map(l => l.price);
        const t      = new Date(`${day}T12:00:00Z`).getTime();
        return {
          time: Math.floor(t / 1000), timestamp: t,
          date: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
          open: prices[0], close: prices[prices.length - 1],
          high: Math.max(...prices), low: Math.min(...prices),
          volume: list.length,
        };
      });
  }
  candleCache.set(key, { at: Date.now(), data: candles });
  return candles;
}

function buildListingCandles(found: Found[], days: number): ListingCandle[] {
  const cutoff = Date.now() - days * 86_400_000;
  const recent = found
    .filter(f => f.created && f.created.getTime() >= cutoff)
    .sort((a, b) => a.created!.getTime() - b.created!.getTime());
  if (!recent.length) return [];
  const sorted = recent.map(f => f.price).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const clean  = recent.filter(f => f.price <= median * 3 && f.price >= median / 3);
  const byDay  = new Map<string, Found[]>();
  for (const f of clean) {
    const d = f.created!.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(f);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, list]) => {
    const prices = list.map(l => l.price);
    const t      = new Date(`${day}T12:00:00Z`).getTime();
    return {
      time: Math.floor(t / 1000), timestamp: t,
      date: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      open: prices[0], close: prices[prices.length - 1],
      high: Math.max(...prices), low: Math.min(...prices), volume: list.length,
    };
  });
}

export type EbayMarket = {
  status:    "available" | "no_listings" | "unavailable";
  price:     number;
  listings:  EbaySale[];
  candles:   ListingCandle[];
  checkedAt: string;
};

// ONE live eBay search -> current price, newest listings, and 14-day candles
export async function fetchEbayMarket(cardName: string, days = 14): Promise<EbayMarket> {
  const checkedAt = new Date().toISOString();
  const found = await searchPSA10(cardName, { sort: "newlyListed", maxPages: 3, until: Date.now() - days * 86_400_000 });
  if (!found) return { status: "unavailable", price: 0, listings: [], candles: [], checkedAt };
  const listings = [...found]
    .sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0))
    .slice(0, MAX_RESULTS)
    .map(f => ({
      id: f.id,
      date: f.created ? f.created.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Active",
      price: f.price, condition: "PSA 10", title: f.title,
    }));
  return {
    status: listings.length ? "available" : "no_listings",
    price: calcAvgPrice(listings),
    listings, candles: buildListingCandles(found, days), checkedAt,
  };
}

// Outlier-resistant average: drops the top and bottom 10% when there are 5+ prices. 0 = no data.
export function calcAvgPrice(sales: EbaySale[]): number {
  if (!sales.length) return 0;
  const prices = sales.map(s => s.price).sort((a, b) => a - b);
  const trim   = prices.length >= 5 ? Math.floor(prices.length * 0.1) : 0;
  const kept   = prices.slice(trim, prices.length - trim);
  return Math.round(kept.reduce((s, p) => s + p, 0) / kept.length);
}

export type PriceHistory = {
  week:       { current: number; previous: number; changePct: number; available?: boolean };
  threeMonth: { current: number; previous: number; changePct: number; available?: boolean };
  year:       { current: number; previous: number; changePct: number; available?: boolean };
  available:  boolean;   // false = no historical data; UI should show "—" instead of 0%
};

export type LiquidityScore = {
  score:          number;
  label:          string;
  salesPerMonth:  number;
  daysToSell:     number;
};

// No historical price source yet (needs stored daily snapshots or eBay sold-data access),
// so report "not available" instead of inventing gains.
export function calcPriceHistory(sales: EbaySale[]): PriceHistory {
  const current = calcAvgPrice(sales);
  const flat    = () => ({ current, previous: current, changePct: 0 });
  return { week: flat(), threeMonth: flat(), year: flat(), available: false };
}

// Based on how many active listings exist (supply), since completed-sale counts aren't available.
export function calcLiquidity(sales: EbaySale[]): LiquidityScore {
  const salesPerMonth = sales.length * 3;
  const daysToSell    = salesPerMonth > 30 ? 1 : salesPerMonth > 15 ? 3 : 7;
  const score         = Math.min(100, salesPerMonth * 2);
  const label         = sales.length === 0 ? "NO DATA" : score > 60 ? "LIQUID" : score > 30 ? "MODERATE" : "ILLIQUID";
  return { score, label, salesPerMonth, daysToSell };
}

// % difference between the newest and oldest listings' asking prices (needs 6+ listings)
export function calcPriceChange(sales: EbaySale[]): number {
  if (sales.length < 6) return 0;
  const avg    = (xs: EbaySale[]) => xs.reduce((s, x) => s + x.price, 0) / xs.length;
  const recent = avg(sales.slice(0, 3));
  const older  = avg(sales.slice(-3));
  if (!older) return 0;
  return Math.round(((recent - older) / older) * 1000) / 10;
}


// TEMPORARY: explains how many listings survive each filter (remove after debugging)
export async function debugListingSearch(cardName: string, days = 14) {
  const token = await getEbayToken();
  if (!token) return { error: "no eBay token" };
  const { name, lastName, setWords, rookie } = parseCardName(cardName);
  const query  = [name, ...setWords, "PSA 10"].join(" ");
  const filter = encodeURIComponent("buyingOptions:{FIXED_PRICE},priceCurrency:USD");
  const cutoff = Date.now() - days * 86_400_000;
  const counts: Record<string, number> = { raw: 0, hasCreatedDate: 0, psa10: 0, lastName: 0, excludeLots: 0, setPhrase: 0, baseOnly: 0, rookie: 0, withinDays: 0 };
  const days_ = new Set<string>();
  const dropped: Record<string, string[]> = {};
  const note = (k: string, t: string) => { (dropped[k] ??= []).length < 3 && dropped[k].push(t.slice(0, 80)); };

  for (let page = 0; page < 5; page++) {
    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&category_ids=261328&filter=${filter}&limit=200&offset=${page * 200}&sort=newlyListed`,
      { headers: { "Authorization": `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" } }
    );
    if (!res.ok) return { error: `search failed ${res.status}`, query, counts };
    const items: any[] = (await res.json()).itemSummaries ?? [];
    for (const it of items) {
      counts.raw++;
      const t = String(it.title ?? "").toLowerCase();
      if (it.itemCreationDate) counts.hasCreatedDate++;
      if (!t.includes("psa 10")) { note("psa10", t); continue; } counts.psa10++;
      if (lastName && !t.includes(lastName)) { note("lastName", t); continue; } counts.lastName++;
      if (EXCLUDE_RE.test(t)) { note("excludeLots", t); continue; } counts.excludeLots++;
      if (!setWords.every(w => t.includes(w))) { note("setPhrase", t); continue; } counts.setPhrase++;
      if (PARALLEL_RE.test(t)) { note("baseOnly", t); continue; } counts.baseOnly++;
      if (rookie && !/\b(rc|rookie)\b/.test(t)) { note("rookie", t); continue; } counts.rookie++;
      const created = it.itemCreationDate ? new Date(it.itemCreationDate).getTime() : 0;
      if (!created || created < cutoff) { note("withinDays", `${it.itemCreationDate ?? "no date"} ${t}`); continue; }
      counts.withinDays++;
      days_.add(new Date(created).toLocaleDateString("en-CA", { timeZone: "America/New_York" }));
    }
    const oldest = items.length ? new Date(items[items.length - 1]?.itemCreationDate ?? 0).getTime() : 0;
    if (items.length < 200 || (oldest && oldest < cutoff)) break;
  }
  return { cardName, query, setWords, rookie, counts, daysWithListings: [...days_].sort(), droppedExamples: dropped };
}
