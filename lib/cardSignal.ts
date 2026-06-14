// ─── lib/cardSignal.ts ───────────────────────────────────────────────────────
// Combines sentiment + price momentum + eBay sales to generate BUY/SELL/HOLD.

import type { MLBStats, EbaySale, SentimentScore, CardSignal } from "@/lib/cardTypes";
import { calcAvgPrice, calcPriceChange } from "@/lib/ebay";

export function generateSignal(
  stats:     MLBStats | null,
  sales:     EbaySale[],
  sentiment: SentimentScore,
): CardSignal {
  const avgPrice    = calcAvgPrice(sales);
  const priceChange = calcPriceChange(sales);
  const reasons: string[] = [];

  let score = 0;

  // ── Sentiment contribution ────────────────────────────────────────────────
  if (sentiment.score >= 75)      { score += 3; reasons.push("Strong performance sentiment"); }
  else if (sentiment.score >= 60) { score += 1; reasons.push("Positive sentiment trend"); }
  else if (sentiment.score <= 30) { score -= 3; reasons.push("Weak performance sentiment"); }
  else if (sentiment.score <= 42) { score -= 1; reasons.push("Below-average sentiment"); }

  // ── Price momentum ────────────────────────────────────────────────────────
  if (priceChange > 8)        { score += 2; reasons.push(`Price up ${priceChange}% — momentum building`); }
  else if (priceChange > 3)   { score += 1; reasons.push(`Price up ${priceChange}% — mild uptrend`); }
  else if (priceChange < -8)  { score -= 2; reasons.push(`Price down ${priceChange}% — selling pressure`); }
  else if (priceChange < -3)  { score -= 1; reasons.push(`Price down ${priceChange}% — softening demand`); }

  // ── Last game spike signal ────────────────────────────────────────────────
  if (stats?.lastGame) {
    const lg = stats.lastGame;
    if (lg.hr >= 1 && priceChange < 5) {
      score += 2;
      reasons.push("HR game but price hasn't moved yet — early buy window");
    }
    if (lg.hits === 0 && priceChange > 0) {
      score -= 2;
      reasons.push("0-hit game + elevated price — sell into strength");
    }
  }

  // ── OPS quality check ─────────────────────────────────────────────────────
  if (stats) {
    if (stats.ops >= 0.900) { score += 1; reasons.push("Elite OPS supports card value"); }
    if (stats.ops < 0.650)  { score -= 1; reasons.push("Poor OPS weighing on demand"); }
  }

  // ── Generate signal ───────────────────────────────────────────────────────
  let signal: CardSignal["signal"] = "HOLD";
  if (score >= 3)       signal = "BUY";
  else if (score <= -3) signal = "SELL";

  const confidence = Math.min(95, Math.max(40, 55 + Math.abs(score) * 8));

  // ── Price targets ─────────────────────────────────────────────────────────
  const buyBelow  = signal === "BUY"  ? Math.round(avgPrice * 0.95)  : null;
  const sellAbove = signal === "SELL" ? Math.round(avgPrice * 1.08)  :
                    signal === "HOLD" ? Math.round(avgPrice * 1.15)  : null;

  // Fill reasons if sparse
  if (reasons.length === 0) reasons.push("No strong directional edge — hold current position");

  return {
    signal,
    confidence: Math.round(confidence),
    reasons:    reasons.slice(0, 3),
    buyBelow,
    sellAbove,
  };
}
