export class NewsAgent {
  static analyze() {
    const rand = Math.random();

    return {
      sentiment:
        rand > 0.55 ? "BULLISH" :
        rand < 0.45 ? "BEARISH" :
        "NEUTRAL",

      confidence: 55 + Math.random() * 45,
      reason: "News sentiment NLP simulation model",
    };
  }
}