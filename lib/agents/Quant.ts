export class QuantAgent {
  static analyze(market: any) {
    const score = market.changePct;

    return {
      sentiment:
        score > 1 ? "BULLISH" :
        score < -1 ? "BEARISH" :
        "NEUTRAL",

      confidence: 60 + Math.random() * 40,
      reason: "Momentum + volatility statistical model",
    };
  }
}