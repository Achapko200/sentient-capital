// ─── lib/sentiment.ts ────────────────────────────────────────────────────────
// Builds a sentiment score from MLB performance data.
// When X API is added, this merges social + performance signals.

import type { MLBStats, SentimentScore } from "@/lib/cardTypes";

export function calcSentiment(stats: MLBStats | null, priceChange: number): SentimentScore {
  const reasons: string[] = [];
  let score = 50; // neutral baseline

  if (!stats) {
    return { score: 50, label: "NEUTRAL", reasons: ["No stats available yet"] };
  }

  // ── Last game performance ─────────────────────────────────────────────────
  if (stats.lastGame) {
    const lg = stats.lastGame;

    if (lg.hr >= 2)        { score += 18; reasons.push(`${lg.hr} HR last game — card demand spiking`); }
    else if (lg.hr === 1)  { score += 10; reasons.push("HR last game — positive momentum"); }

    if (lg.hits >= 3)      { score += 10; reasons.push(`${lg.hits}-hit game — hot streak signal`); }
    else if (lg.hits === 0 && lg.avg < 0.150) {
                             score -= 12; reasons.push("0-for last game — sell pressure likely"); }

    if (lg.rbi >= 3)       { score += 8;  reasons.push(`${lg.rbi} RBI performance — collector interest up`); }
  }

  // ── Season batting average ────────────────────────────────────────────────
  if (stats.avg >= 0.300)      { score += 12; reasons.push(`Batting .${Math.round(stats.avg * 1000)} — elite AVG`); }
  else if (stats.avg >= 0.270) { score += 6;  reasons.push(`Batting .${Math.round(stats.avg * 1000)} — solid`); }
  else if (stats.avg < 0.220)  { score -= 10; reasons.push(`Batting .${Math.round(stats.avg * 1000)} — slump hurting value`); }

  // ── Home runs ─────────────────────────────────────────────────────────────
  if (stats.hr >= 20)      { score += 10; reasons.push(`${stats.hr} HR on season — power numbers strong`); }
  else if (stats.hr >= 10) { score += 5;  reasons.push(`${stats.hr} HR — on pace for solid season`); }

  // ── OPS ───────────────────────────────────────────────────────────────────
  if (stats.ops >= 0.900)      { score += 10; reasons.push(`OPS ${stats.ops.toFixed(3)} — MVP-caliber`); }
  else if (stats.ops >= 0.800) { score += 5;  reasons.push(`OPS ${stats.ops.toFixed(3)} — above average`); }
  else if (stats.ops < 0.650)  { score -= 8;  reasons.push(`OPS ${stats.ops.toFixed(3)} — struggling`); }

  // ── Price momentum ────────────────────────────────────────────────────────
  if (priceChange > 10)       { score += 8;  reasons.push(`Card up ${priceChange}% — momentum buy`); }
  else if (priceChange > 5)   { score += 4;  reasons.push(`Card up ${priceChange}% — trending`); }
  else if (priceChange < -10) { score -= 8;  reasons.push(`Card down ${priceChange}% — sell pressure`); }
  else if (priceChange < -5)  { score -= 4;  reasons.push(`Card down ${priceChange}% — softening`); }

  score = Math.min(100, Math.max(0, score));

  const label: SentimentScore["label"] =
    score >= 80 ? "VERY BULLISH" :
    score >= 62 ? "BULLISH" :
    score >= 42 ? "NEUTRAL" :
    score >= 25 ? "BEARISH" : "VERY BEARISH";

  return { score, label, reasons: reasons.slice(0, 4) };
}
