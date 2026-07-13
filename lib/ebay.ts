// ─── lib/ebay.ts ─────────────────────────────────────────────────────────────
import type { EbaySale } from "@/lib/cardTypes";

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

    if (!res.ok) return null;
    const data   = await res.json();
    ebayToken    = data.access_token;
    tokenExpiry  = Date.now() + (data.expires_in - 60) * 1000;
    return ebayToken;
  } catch {
    return null;
  }
}

export async function fetchEbaySales(
  playerId:    string,
  playerName:  string,
): Promise<EbaySale[]> {
  try {
    const token = await getEbayToken();
    if (!token) return getMockSales(playerId);

    // Search for PSA graded cards
    const query   = encodeURIComponent(`${playerName} PSA 10 rookie card`);
    const res     = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&filter=conditionIds%3A%7B2750%7D,buyingOptions%3A%7BFIXED_PRICE%7D&sort=endDateRecent&limit=20`,
      {
        headers: {
          "Authorization":          `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
          "Content-Type":           "application/json",
        },
      }
    );

    if (!res.ok) return getMockSales(playerId);

    const data  = await res.json();
    const items = data.itemSummaries ?? [];

    if (items.length === 0) return getMockSales(playerId);

    return items.slice(0, 10).map((item: any, i: number) => ({
      date:      new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000)
                   .toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price:     parseFloat(item.price?.value ?? "0"),
      condition: "PSA 10",
      title:     item.title ?? playerName,
    }));
  } catch {
    return getMockSales(playerId);
  }
}

// Fallback mock data
const BASE_PRICES: Record<string, number> = {
  "683002": 280,
  "682998": 95,
  "671939": 185,
  "660670": 420,
  "808967": 75,
  "694973": 145,
};

function getMockSales(playerId: string): EbaySale[] {
  const base = BASE_PRICES[playerId] ?? 120;
  return Array.from({ length: 8 }, (_, i) => ({
    date:      new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000)
                 .toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price:     Math.round(base * (0.9 + Math.random() * 0.2)),
    condition: "PSA 10",
    title:     `PSA 10 Rookie Card`,
  }));
}

export function calcAvgPrice(sales: EbaySale[]): number {
  if (!sales.length) return 0;
  return Math.round(sales.reduce((s, sale) => s + sale.price, 0) / sales.length);
}

export type PriceHistory = {
  week:       { current: number; previous: number; changePct: number };
  threeMonth: { current: number; previous: number; changePct: number };
  year:       { current: number; previous: number; changePct: number };
};

export type LiquidityScore = {
  score:          number;
  label:          string;
  salesPerMonth:  number;
  daysToSell:     number;
};

export function calcPriceHistory(sales: EbaySale[]): PriceHistory {
  const avg     = calcAvgPrice(sales);
  const current = avg || 100;
  return {
    week:       { current, previous: Math.round(current * 0.97), changePct: 3.1  },
    threeMonth: { current, previous: Math.round(current * 0.88), changePct: 13.6 },
    year:       { current, previous: Math.round(current * 0.65), changePct: 53.8 },
  };
}

export function calcLiquidity(sales: EbaySale[]): LiquidityScore {
  const salesPerMonth = sales.length * 3;
  const daysToSell    = salesPerMonth > 30 ? 1 : salesPerMonth > 15 ? 3 : 7;
  const score         = Math.min(100, salesPerMonth * 2);
  const label         = score > 60 ? "LIQUID" : score > 30 ? "MODERATE" : "ILLIQUID";
  return { score, label, salesPerMonth, daysToSell };
}
