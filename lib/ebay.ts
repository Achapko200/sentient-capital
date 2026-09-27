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

async function getEbayToken(): Promise<string | null> {
  if (ebayToken && Date.now() < tokenExpiry) return ebayToken;

  const appId  = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) return null;

  try {
    const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
    const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
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

// Returns current PSA 10 listings for the player, newest first. Empty array if unavailable.
export async function fetchEbaySales(
  playerId:   string,
  playerName: string,
): Promise<EbaySale[]> {
  try {
    const token = await getEbayToken();
    if (!token) {
      console.warn("[ebay] no API token - returning no data");
      return [];
    }

    const nameParts = String(playerName ?? "").split(/\s+/).filter(Boolean);
    const justName  = nameParts.slice(0, 2).join(" ");
    const lastName  = (nameParts[1] ?? nameParts[0] ?? "").toLowerCase();
    if (!justName) return [];

    const query  = encodeURIComponent(`${justName} PSA 10`);
    const filter = encodeURIComponent("buyingOptions:{FIXED_PRICE},priceCurrency:USD");
    const res    = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&category_ids=261328&filter=${filter}&limit=${SEARCH_LIMIT}`,
      {
        headers: {
          "Authorization":           `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
          "Content-Type":            "application/json",
        },
      }
    );
    if (!res.ok) {
      console.error("[ebay] search failed:", res.status, "player", playerId);
      return [];
    }

    const data  = await res.json();
    const items: any[] = data.itemSummaries ?? [];

    return items
      .filter(it => {
        const t = String(it.title ?? "").toLowerCase();
        return t.includes("psa 10") && (!lastName || t.includes(lastName)) && !EXCLUDE_RE.test(t);
      })
      .map(it => ({
        it,
        price:   parseFloat(it.price?.value ?? "0"),
        created: it.itemCreationDate ? new Date(it.itemCreationDate) : null,
      }))
      .filter(x => Number.isFinite(x.price) && x.price > 0)
      .sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0))
      .slice(0, MAX_RESULTS)
      .map(({ it, price, created }) => ({
        id:        String(it.itemId),
        date:      created ? created.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Active",
        price,
        condition: "PSA 10",
        title:     String(it.title),
      }));
  } catch (err) {
    console.error("[ebay] error:", err);
    return [];
  }
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
  week:       { current: number; previous: number; changePct: number };
  threeMonth: { current: number; previous: number; changePct: number };
  year:       { current: number; previous: number; changePct: number };
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
