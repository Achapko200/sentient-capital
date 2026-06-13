import { StrategyEngine } from "@/lib/StrategyEngine";

type MarketTick = {
  symbol: string;
  price: number;
  changePct: number;
};

type Insight = {
  symbol: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
};

export class FundEngine {
  private interval: any = null;

  private market: MarketTick[] = [
    { symbol: "NVDA", price: 142.3, changePct: 1.8 },
    { symbol: "TSLA", price: 248.1, changePct: -2.1 },
    { symbol: "SPY", price: 512.4, changePct: 0.3 },
    { symbol: "AAPL", price: 192.5, changePct: 0.9 },
    { symbol: "BTC", price: 68400, changePct: -1.2 },
  ];

  private generateInsight(symbol: string): Insight {
    const rand = Math.random();

    let sentiment: Insight["sentiment"] = "NEUTRAL";

    if (rand > 0.6) sentiment = "BULLISH";
    if (rand < 0.3) sentiment = "BEARISH";

    return {
      symbol,
      sentiment,
      confidence: Math.floor(50 + Math.random() * 50),
    };
  }

  private simulateMarketTick(tick: MarketTick): MarketTick {
    const volatility = tick.symbol === "BTC" ? 5 : 0.8;

    const move = (Math.random() - 0.5) * volatility;

    return {
      ...tick,
      price: Number((tick.price + move).toFixed(2)),
      changePct: Number((move / tick.price) * 100),
    };
  }

  start(onTrade: (trade: any) => void) {
    if (this.interval) return;

    this.interval = setInterval(() => {
      // 1. update market
      this.market = this.market.map((t) =>
        this.simulateMarketTick(t)
      );

      // 2. pick random asset
      const asset =
        this.market[Math.floor(Math.random() * this.market.length)];

      // 3. generate insight
      const insight = this.generateInsight(asset.symbol);

      // 4. run strategy engine
      const decision = StrategyEngine.generateDecision(
        asset,
        insight
      );

      if (decision.action === "HOLD") return;

      // 5. emit trade
      onTrade({
        id: Date.now(),
        symbol: decision.symbol,
        action: decision.action,
        size: decision.size,
        confidence: decision.confidence,
        reason: decision.reason,
        time: new Date().toLocaleTimeString(),
      });

    }, 2000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}