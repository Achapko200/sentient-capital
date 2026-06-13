export type MarketData = {
  symbol: string;
  price: number;
  changePct: number;
};

export type InsightSignal = {
  symbol: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number; // 0–100
};

export type TradeDecision = {
  symbol: string;
  action: "BUY" | "SELL" | "HEDGE" | "HOLD";
  size: number; // position size %
  confidence: number;
  reason: string;
};

export class StrategyEngine {
  static generateDecision(
    market: MarketData,
    insight: InsightSignal
  ): TradeDecision {

    // Base score
    let score = 0;

    // 1. Sentiment influence
    if (insight.sentiment === "BULLISH") score += 2;
    if (insight.sentiment === "BEARISH") score -= 2;

    // 2. Price momentum influence
    if (market.changePct > 1) score += 1;
    if (market.changePct < -1) score -= 1;

    // 3. Confidence weighting
    const confidenceWeight = insight.confidence / 100;
    score = score * confidenceWeight;

    // 4. Decision logic
    let action: TradeDecision["action"] = "HOLD";
    let size = 0;

    if (score >= 2.5) {
      action = "BUY";
      size = Math.min(25, confidenceWeight * 25);
    } else if (score <= -2.5) {
      action = "SELL";
      size = Math.min(25, confidenceWeight * 25);
    } else if (score <= -1.5) {
      action = "HEDGE";
      size = Math.min(15, confidenceWeight * 15);
    }

    return {
      symbol: market.symbol,
      action,
      size: Number(size.toFixed(2)),
      confidence: insight.confidence,
      reason: this.explain(score, insight),
    };
  }

  static explain(score: number, insight: InsightSignal): string {
    if (score > 2)
      return `Strong bullish alignment between sentiment and momentum`;
    if (score < -2)
      return `Bearish pressure detected across sentiment + price action`;
    return `No strong edge detected — neutral positioning recommended`;
  }
}