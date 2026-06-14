// ─── lib/ebay.ts ─────────────────────────────────────────────────────────────
// Returns eBay recent sales. Uses real eBay API if EBAY_TOKEN is set,
// otherwise returns realistic mock data based on player performance.

import type { EbaySale } from "@/lib/cardTypes";

// Base prices per player card (realistic 2025 PSA 10 values)
const BASE_PRICES: Record<string, number> = {
  "683002": 280,  // Paul Skenes
  "682998": 95,   // Jackson Holliday
  "671939": 185,  // Gunnar Henderson
  "660670": 420,  // Ronald Acuña Jr.
  "808967": 75,   // Wyatt Langford
  "694973": 145,  // Julio Rodriguez
};

function randomAround(base: number, variance: number = 0.12): number {
  return Math.round(base * (1 + (Math.random() - 0.5) * variance));
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getMockSales(playerId: string, cardName: string): EbaySale[] {
  const base = BASE_PRICES[playerId] ?? 100;

  // Simulate 6 recent sales with slight price trend
  return [
    { id: "1", title: cardName, price: randomAround(base * 1.05), date: daysAgo(1),  condition: "PSA 10" },
    { id: "2", title: cardName, price: randomAround(base * 1.02), date: daysAgo(2),  condition: "PSA 10" },
    { id: "3", title: cardName, price: randomAround(base),        date: daysAgo(4),  condition: "PSA 10" },
    { id: "4", title: cardName, price: randomAround(base * 0.98), date: daysAgo(7),  condition: "PSA 10" },
    { id: "5", title: cardName, price: randomAround(base * 0.95), date: daysAgo(10), condition: "PSA 10" },
    { id: "6", title: cardName, price: randomAround(base * 0.93), date: daysAgo(14), condition: "PSA 10" },
  ];
}

export async function fetchEbaySales(playerId: string, cardName: string): Promise<EbaySale[]> {
  const token = process.env.EBAY_TOKEN;

  if (!token) {
    return getMockSales(playerId, cardName);
  }

  try {
    const query = encodeURIComponent(`${cardName} PSA 10`);
    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&filter=conditionIds:{2750},soldItems:true&sort=newlyListed&limit=6`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 1800 },
      },
    );

    if (!res.ok) return getMockSales(playerId, cardName);

    const json = await res.json();
    const items = json?.itemSummaries ?? [];

    return items.map((item: {
      itemId: string;
      title: string;
      price?: { value: string };
      itemEndDate?: string;
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
