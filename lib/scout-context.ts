// Builds live market context for Scout from the same data the card pages use.
import { getPlayer }      from "@/lib/players";
import { fetchMLBStats }  from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice, calcPriceChange, calcLiquidity } from "@/lib/ebay";
import { calcSentiment }  from "@/lib/sentiment";
import { generateSignal } from "@/lib/cardSignal";

export type Candidate = { id: string; name: string };

const MAX_MENTIONED   = 3;     // players named in the question
const DEFAULT_PLAYERS = 5;     // for general "what should I buy" questions
const TIMEOUT_MS      = 5000;

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T | null> {
  return Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), ms))]).catch(() => null);
}

const compact = (v: unknown, max: number) => {
  try {
    const s = JSON.stringify(v);
    if (!s) return "not available";
    return s.length > max ? s.slice(0, max) + "…" : s;
  } catch { return "not available"; }
};
const money = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}` : "not available";
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Which tracked players does the question mention? (full name, or a unique last name)
export function pickPlayers(question: string, candidates: Candidate[]): Candidate[] {
  const q = question.toLowerCase();
  const lastCounts = new Map<string, number>();
  for (const c of candidates) {
    const last = c.name.toLowerCase().split(/\s+/).pop() ?? "";
    lastCounts.set(last, (lastCounts.get(last) ?? 0) + 1);
  }
  return candidates
    .filter(c => {
      const full = c.name.toLowerCase();
      if (q.includes(full)) return true;
      const last = full.split(/\s+/).pop() ?? "";
      return last.length >= 4 && lastCounts.get(last) === 1 && new RegExp(`\\b${escapeRe(last)}\\b`).test(q);
    })
    .slice(0, MAX_MENTIONED);
}

async function playerBlock(c: Candidate): Promise<string | null> {
  const player: any = await withTimeout(getPlayer(c.id));   // server-side lookup: client ids are never trusted
  if (!player) return null;

  const [stats, rawSales]: any[] = await Promise.all([
    withTimeout(fetchMLBStats(player.id)),
    withTimeout(fetchEbaySales(player.id, player.cardName)),
  ]);
  const sales: any    = Array.isArray(rawSales) ? rawSales : [];
  const avgPrice      = calcAvgPrice(sales);
  const priceChange   = calcPriceChange(sales);
  const liquidity     = calcLiquidity(sales);
  const sentiment     = calcSentiment(stats, priceChange);
  const signal        = generateSignal(stats, sales, sentiment);

  return [
    `Player: ${player.name}${player.cardName ? ` (card: ${player.cardName})` : ""}`,
    `Average asking price: ${money(avgPrice)} across ${sales.length} current eBay PSA 10 listings (asking prices, not completed sales)`,
    `Asking-price change, newest vs oldest listings: ${sales.length >= 6 ? compact(priceChange, 60) + "%" : "not enough listings"}`,
    `Liquidity: ${compact(liquidity, 80)}`,
    `Season stats: ${stats ? compact(stats, 400) : "not available"}`,
    `Card Tracker signal: ${compact(signal, 400)}`,
    `Sentiment: ${compact(sentiment, 200)}`,
  ].join("\n");
}

export async function buildMarketContext(question: string, candidates: Candidate[]): Promise<string> {
  let picked = pickPlayers(question, candidates);
  if (picked.length === 0 && /\b(buy|sell|invest|best|hot|trending|pick|recommend|undervalued)\b/i.test(question)) {
    picked = candidates.slice(0, DEFAULT_PLAYERS);
  }
  if (picked.length === 0) return "";

  const blocks = (await Promise.all(picked.map(c => playerBlock(c).catch(() => null)))).filter(Boolean);
  if (blocks.length === 0) return "";
  return `LIVE MARKET DATA from Card Tracker (${new Date().toISOString().slice(0, 10)}):\n\n${blocks.join("\n\n")}`;
}
