// ─── agents/News.ts ──────────────────────────────────────────────────────────
// News agent: keyword-based sentiment on symbol-specific news headlines.

import type { AssetState, AgentVote } from "@/types";
import { getNewsForSymbol } from "@/lib/market";

const BULLISH_KEYWORDS = [
  "beats", "surge", "record", "high", "growth", "upgrade", "inflow",
  "acceleration", "breakout", "improvement", "buy", "rally", "confirmation",
  "supercycle", "beats estimates", "all-time high",
];

const BEARISH_KEYWORDS = [
  "disappoint", "cut", "restrict", "investigation", "fine", "capitulate",
  "pressure", "fall", "fear", "inversion", "low", "headwinds", "rumored",
  "recession", "tightness", "antitrust",
];

function scoreHeadline(headline: string): number {
  const lower = headline.toLowerCase();
  let score = 0;
  for (const word of BULLISH_KEYWORDS) if (lower.includes(word)) score += 1;
  for (const word of BEARISH_KEYWORDS) if (lower.includes(word)) score -= 1;
  return score;
}

export class NewsAgent {
  static analyze(asset: AssetState): AgentVote & { headline: string } {
    const headline = getNewsForSymbol(asset.symbol);
    const score    = scoreHeadline(headline);

    // Add some noise — news interpretation isn't deterministic
    const noise = (Math.random() - 0.5) * 0.6;
    const final = score + noise;

    const sentiment: AgentVote["sentiment"] =
      final > 0.4 ? "BULLISH" : final < -0.4 ? "BEARISH" : "NEUTRAL";

    const confidence = Math.min(90, Math.max(40, 55 + Math.abs(final) * 12));

    return {
      sentiment,
      confidence,
      reason: `News: "${headline.slice(0, 60)}${headline.length > 60 ? "…" : ""}"`,
      headline,
    };
  }
}
