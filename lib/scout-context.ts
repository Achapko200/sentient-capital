// Builds live market context for Scout from the same data the card pages use.
import { getPlayer }      from "@/lib/players";
import { fetchMLBStats }  from "@/lib/mlb";
import { calcAvgPrice } from "@/lib/ebay";
import { getMarketData } from "@/lib/market-cache";
import { getPriceHistory } from "@/lib/price-history";
import { calcSentiment }  from "@/lib/sentiment";
import { generateSignal } from "@/lib/cardSignal";
import type { CardSignal, MLBStats } from "@/lib/cardTypes";

export type Candidate = { id: string; name: string };

export type LiveMarketCard = {
  id: string;
  name: string;
  cardName: string | null;
  listingStatus: "available" | "no_listings" | "unavailable";
  listingCount: number;
  averageAskingPrice: number | null;
  checkedAt: string;
  stats: MLBStats | null;
  priceChange7d: number | null;
  signal: CardSignal | null;
};

export type LiveMarketContext = {
  cards: LiveMarketCard[];
  context: string;
};

const MAX_MENTIONED   = 3;     // players named in the question
const DEFAULT_PLAYERS = 8;     // inspect enough of the market to find actual listings
const TIMEOUT_MS      = 10_000;

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T | null> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), ms);
    p.then(value => {
      clearTimeout(timer);
      resolve(value);
    }).catch(() => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

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

async function loadLiveCard(candidate: Candidate): Promise<LiveMarketCard> {
  const player: any = await withTimeout(getPlayer(candidate.id));
  if (!player) {
    return {
      id: candidate.id,
      name: candidate.name,
      cardName: null,
      listingStatus: "unavailable",
      listingCount: 0,
      averageAskingPrice: null,
      checkedAt: new Date().toISOString(),
      stats: null,
      priceChange7d: null,
      signal: null,
    };
  }

  const [statsResult, marketResult] = await Promise.all([
    withTimeout(fetchMLBStats(player.id)),
    withTimeout(getMarketData(String(player.id), player.cardName).then(m => ({ listings: m.listings, status: m.status, checkedAt: m.updatedAt ?? new Date().toISOString() }))),
  ]);
  const stats = statsResult ?? null;
  const market = marketResult;
  const listings = market?.listings ?? [];
  const averageAskingPrice = listings.length > 0 ? calcAvgPrice(listings) : null;
  const priceHistory = averageAskingPrice === null
    ? null
    : await withTimeout(getPriceHistory(player.id, averageAskingPrice));
  const priceChange7d = priceHistory?.week.available ? priceHistory.week.changePct : null;
  const sentiment = calcSentiment(stats, priceChange7d ?? 0);
  const signal = generateSignal(stats, listings, sentiment);

  return {
    id: String(player.id),
    name: player.name,
    cardName: player.cardName ?? null,
    listingStatus: market?.status ?? "unavailable",
    listingCount: listings.length,
    averageAskingPrice,
    checkedAt: market?.checkedAt ?? new Date().toISOString(),
    stats,
    priceChange7d,
    signal,
  };
}

export async function buildMarketContext(question: string, candidates: Candidate[]): Promise<LiveMarketContext> {
  let picked = pickPlayers(question, candidates);
  if (picked.length === 0 && /\b(buy|sell|invest|best|hot|trending|pick|recommend|undervalued)\b/i.test(question)) {
    picked = candidates.slice(0, DEFAULT_PLAYERS);
  }
  if (picked.length === 0) return { cards: [], context: "" };

  const cards = await Promise.all(picked.map(candidate =>
    loadLiveCard(candidate).catch(() => ({
      id: candidate.id,
      name: candidate.name,
      cardName: null,
      listingStatus: "unavailable" as const,
      listingCount: 0,
      averageAskingPrice: null,
      checkedAt: new Date().toISOString(),
      stats: null,
      priceChange7d: null,
      signal: null,
    }))
  ));
  const context = cards.length
    ? `VERIFIED LIVE LOOKUPS (checked ${new Date().toISOString()}). Use these records only; unavailable means the source did not return data, not zero listings.\n${JSON.stringify(cards)}`
    : "";
  return { cards, context };
}
