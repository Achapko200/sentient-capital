export class MacroAgent {
  static analyze() {
    const rand = Math.random();

    return {
      sentiment:
        rand > 0.6 ? "BULLISH" :
        rand < 0.4 ? "BEARISH" :
        "NEUTRAL",

      confidence: 50 + Math.random() * 50,
      reason: "Macro conditions driven by rates/liquidity model",
    };
  }
}