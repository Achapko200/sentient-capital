// ─── lib/ebay.ts ─────────────────────────────────────────────────────────────

import type { EbaySale } from "@/lib/cardTypes";

const BASE_PRICES: Record<string, number> = {
  "683002": 280,  // Paul Skenes
  "682998": 95,   // Jackson Holliday
  "671939": 185,  // Gunnar Henderson
  "660670": 420,  // Ronald Acuña Jr.
  "808967": 75,   // Wyatt Langford
  "694973": 145,  // Julio Rodriguez
};

// How many sales per month (drives liquidity score)
const MONTHLY_VOLUME: Record<string, number> = {
  "683002": 45,  // Skenes — very liquid
  "682998": 18,  // Holliday — moderate
  "671939": 38,  // Henderson — liquid
  "660670": 62,  // Acuña — very liquid
  "808967": 12,  // Langford — thin
  "694973": 28,  // J-Rod — moderate
};

// Season trend multipliers (how the card has moved over time)
const TREND: Record<string, { week: number; threeMonth: number; year: number }> = {
  "683002": { week: 1.075, threeMonth: 1.22,  year: 1.85  }, // Skenes up huge
  "682998": { week: 1.081, threeMonth: 0.88,  year: 1.40  }, // Holliday mixed
  "671939": { week: 1.081, threeMonth: 1.15,  year: 1.55  }, // Henderson steady up
  "660670": { week: 1.059, threeMonth: 1.31,  year: 2.10  }, // Acuña up big
  "808967": { week: 1.055, threeMonth: 0.92,  year: 1.20  }, // Langford down recently
  "694973": { week: 1.073, threeMonth: 1.08,  year: 1.35  }, // J-Rod modest
};

function randomAround(base: number, variance: number = 0.08): number {
  return Math.round(base * (1 + (Math.random() - 0.5) * variance));
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type PriceHistory = {
  week:       { current: number; previous: number; changePct: number };
  threeMonth: { current: number; previous: number; changePct: number };
  year:       { current: number; previous: number; changePct: number };
};

export type LiquidityScore = {
  score:       number;   // 0-100
  label:       "VERY LIQUID" | "LIQUID" | "MODERATE" | "THIN" | "ILLIQUID";
  salesPerMonth: number;
  daysToSell:  number;
  color:       string;
};

export function getMockSales(playerId: string, cardName: string): EbaySale[] {
  const base = BASE_PRICES[playerId] ?? 100;
  return [
    { id: "1", title: cardName, price: randomAround(base * 1.05), date: daysAgo(1),  condition: "PSA 10" },
    { id: "2", title: cardName, price: randomAround(base * 1.02), date: daysAgo(3),  condition: "PSA 10" },
    { id: "3", title: cardName, price: randomAround(base),        date: daysAgo(5),  condition: "PSA 10" },
    { id: "4", title: cardName, price: randomAround(base * 0.98), date: daysAgo(8),  condition: "PSA 10" },
    { id: "5", title: cardName, price: randomAround(base * 0.95), date: daysAgo(11), condition: "PSA 10" },
    { id: "6", title: cardName, price: randomAround(base * 0.93), date: daysAgo(14), condition: "PSA 10" },
  ];
}

export function calcPriceHistory(playerId: string): PriceHistory {
  const base  = BASE_PRICES[playerId] ?? 100;
  const trend = TREND[playerId] ?? { week: 1.0, threeMonth: 1.0, year: 1.0 };

  const current        = randomAround(base);
  const weekAgo        = Math.round(current / trend.week);
  const threeMonthAgo  = Math.round(current / trend.threeMonth);
  const yearAgo        = Math.round(current / trend.year);

  const pct = (cur: number, prev: number) =>
    Math.round(((cur - prev) / prev) * 1000) / 10;

  return {
    week:       { current, previous: weekAgo,       changePct: pct(current, weekAgo) },
    threeMonth: { current, previous: threeMonthAgo, changePct: pct(current, threeMonthAgo) },
    year:       { current, previous: yearAgo,       changePct: pct(current, yearAgo) },
  };
}

export function calcLiquidity(playerId: string): LiquidityScore {
  const vol = MONTHLY_VOLUME[playerId] ?? 10;
  const daysToSell = Math.round(30 / vol * 10) / 10;
  const score = Math.min(100, Math.round((vol / 65) * 100));

  const label: LiquidityScore["label"] =
    score >= 80 ? "VERY LIQUID" :
    score >= 55 ? "LIQUID" :
    score >= 35 ? "MODERATE" :
    score >= 18 ? "THIN" : "ILLIQUID";

  const color =
    score >= 80 ? "text-green-600" :
    score >= 55 ? "text-blue-600" :
    score >= 35 ? "text-yellow-600" :
    score >= 18 ? "text-orange-500" : "text-red-600";

  return { score, label, salesPerMonth: vol, daysToSell, color };
}

export async function fetchEbaySales(playerId: string, cardName: string): Promise<EbaySale[]> {
  const token = process.env.EBAY_TOKEN;
  if (!token) return getMockSales(playerId, cardName);

  try {
    const query = encodeURIComponent(`${cardName} PSA 10`);
    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&filter=conditionIds:{2750},soldItems:true&sort=newlyListed&limit=6`,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        next: { revalidate: 1800 },
      },
    );
    if (!res.ok) return getMockSales(playerId, cardName);
    const json  = await res.json();
    const items = json?.itemSummaries ?? [];
    return items.map((item: {
      itemId: string; title: string;
      price?: { value: string }; itemEndDate?: string;
    }, i: number) => ({
      id:        item.itemId ?? String(i),
      title:     item.title ?? cardName,
      price:     parseFloat(item.price?.value ?? "0"),
      date:      item.itemEndDate
        ? new Date(item.itemEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : daysAgo(i + 1),
      condition: "PSA 10",
    }));
  } catch {
    return getMockSales(playerId, cardName);
  }
}

export function calcAvgPrice(sales: EbaySale[]): number {
  if (sales.length === 0) return 0;
  return Math.round(sales.reduce((s, e) => s + e.price, 0) / sales.length);
}

export function calcPriceChange(sales: EbaySale[]): number {
  if (sales.length < 2) return 0;
  const recent = sales.slice(0, 3).reduce((s, e) => s + e.price, 0) / 3;
  const older  = sales.slice(3).reduce((s, e) => s + e.price, 0) / Math.max(sales.slice(3).length, 1);
  if (older === 0) return 0;
  return Math.round(((recent - older) / older) * 100 * 10) / 10;
}