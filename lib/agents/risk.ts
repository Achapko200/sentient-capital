import type { AssetState, AgentVote } from "@/types";
import { getVolatility, getRSI } from "@/lib/indicators";

const HIGH_VOLATILITY: Record<string, number> = {
  NVDA: 3.0, TSLA: 4.0, BTC: 6.0, SPY: 1.5, AAPL: 2.0,
};

export class RiskAgent {
  static analyze(asset: AssetState, positionSizePct: number = 0): AgentVote {
    const prices = asset.history.map((h) => h.price);
    const volatility = getVolatility(prices);
    const rsi = prices.length >= 15 ? getRSI(prices) : 50;
    const volLimit = HIGH_VOLATILITY[asset.symbol] ?? 3.0;
    const risks: string[] = [];
    let riskScore = 0;
    if (positionSizePct > 20) { riskScore += 2; risks.push("position oversize"); }
    else if (positionSizePct > 12) { riskScore += 1; }
    if (volatility > volLimit) { riskScore += 2; risks.push("vol spike " + volatility.toFixed(1) + "%"); }
    if (rsi > 75) { riskScore += 2; risks.push("overbought RSI " + rsi.toFixed(0)); }
    if (asset.changePct < -3) { riskScore += 1; risks.push("sharp daily drop"); }
    const sentiment: AgentVote["sentiment"] = riskScore >= 2 ? "BEARISH" : riskScore === 0 ? "BULLISH" : "NEUTRAL";
    const confidence = Math.min(92, 50 + riskScore * 10);
    const riskLabel = risks.length > 0 ? risks.slice(0, 2).join(", ") : "risk within limits";
    return { sentiment, confidence, reason: "Risk: " + riskLabel };
  }
}
