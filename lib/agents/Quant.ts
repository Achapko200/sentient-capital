// ─── agents/Quant.ts ─────────────────────────────────────────────────────────
// Quant agent: momentum, mean-reversion signals from price history.

import type { AssetState, AgentVote } from "@/types";
import { getSMA, getRSI, getVolatility, getTrend } from "@/lib/indicators";

export class QuantAgent {
  static analyze(asset: AssetState): AgentVote {
    const prices = asset.history.map((h) => h.price);

    // Need at least some history — fall back to changePct signal
    if (prices.length < 5) {
      const changePct = asset.changePct ?? 0;
      return {
        sentiment: changePct > 0.5 ? "BULLISH" : changePct < -0.5 ? "BEARISH" : "NEUTRAL",
        confidence: 55 + Math.abs(changePct) * 4,
        reason: "Quant: Insufficient history — using price momentum signal",
      };
    }

    const trend      = getTrend(prices);
    const rsi        = getRSI(prices);
    const volatility = getVolatility(prices);
    const sma5       = getSMA(prices, 5);
    const sma10      = getSMA(prices, Math.min(10, prices.length));

    // Score-based system
    let score = 0;
    const signals: string[] = [];

    // SMA crossover
    if (sma5 > sma10 * 1.003) { score += 2; signals.push("SMA5 > SMA10"); }
    else if (sma5 < sma10 * 0.997) { score -= 2; signals.push("SMA5 < SMA10"); }

    // Trend
    if (trend === "UP")   { score += 1; signals.push("trend UP"); }
    if (trend === "DOWN") { score -= 1; signals.push("trend DOWN"); }

    // RSI — mean reversion
    if (rsi > 70) { score -= 1.5; signals.push(`RSI overbought (${rsi.toFixed(0)})`); }
    if (rsi < 30) { score += 1.5; signals.push(`RSI oversold (${rsi.toFixed(0)})`); }

    // changePct momentum
    if (asset.changePct > 1)  { score += 0.5; }
    if (asset.changePct < -1) { score -= 0.5; }

    // Confidence inversely proportional to volatility
    const baseConfidence = 60 + Math.abs(score) * 5;
    const volPenalty     = Math.min(20, volatility * 3);
    const confidence     = Math.min(93, Math.max(40, baseConfidence - volPenalty));

    const sentiment: AgentVote["sentiment"] =
      score > 1.5 ? "BULLISH" : score < -1.5 ? "BEARISH" : "NEUTRAL";

    const signalSummary = signals.slice(0, 2).join(", ") || "no strong signal";

    return {
      sentiment,
      confidence,
      reason: `Quant: ${signalSummary} | RSI ${rsi.toFixed(0)} | vol ${volatility.toFixed(2)}%`,
    };
  }
}
