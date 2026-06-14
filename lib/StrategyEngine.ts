type MarketData = {
  symbol: string;
  price: number;
  changePct: number;
};

type Insight = {
  symbol: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
};

export class StrategyEngine {

  static generateDecision(
    market: MarketData,
    insight: Insight,
    agentWeight = 1
  ) {

    // confidence adjusted by agent reputation
    const confidence = Math.min(
      100,
      Math.round(insight.confidence * agentWeight)
    );


    let action = "HOLD";
    let reason = "";


    // AI decision logic
    if (
      insight.sentiment === "BULLISH" &&
      confidence > 60
    ) {
      action = "BUY";
      reason =
        "Bullish signal with strong agent confidence";
    }


    if (
      insight.sentiment === "BEARISH" &&
      confidence > 60
    ) {
      action = "SELL";
      reason =
        "Bearish signal with strong agent confidence";
    }


    if (action === "HOLD") {
      reason =
        "Signal confidence too weak";
    }


    return {
      symbol: market.symbol,
      action,

      // position size based on confidence
      size: Math.round(confidence / 10),

      confidence,

      reason,
    };
  }

}