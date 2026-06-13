import { MacroAgent } from "@/lib/agents/Macro";
import { QuantAgent } from "@/lib/agents/Quant";
import { NewsAgent } from "@/lib/agents/News";
import { StrategyEngine } from "@/lib/StrategyEngine";

type MarketTick = {
  symbol: string;
  price: number;
  changePct: number;
};

type AgentVote = {
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  reason?: string;
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

  private simulateMarketTick(tick: MarketTick): MarketTick {
    const volatility = tick.symbol === "BTC" ? 5 : 0.8;

    const move = (Math.random() - 0.5) * volatility;

    return {
      ...tick,
      price: Number((tick.price + move).toFixed(2)),
      changePct: Number((move / tick.price) * 100),
    };
  }

  private aggregateVotes(votes: AgentVote[]) {
    let score = 0;
    let confidenceSum = 0;

    votes.forEach((v) => {
      const weight = v.confidence / 100;

      confidenceSum += v.confidence;

      if (v.sentiment === "BULLISH") score += weight;
      if (v.sentiment === "BEARISH") score -= weight;
    });

    const avgConfidence = confidenceSum / votes.length;

    let sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";

    if (score > 0.8) sentiment = "BULLISH";
    else if (score < -0.8) sentiment = "BEARISH";

    return {
      sentiment,
      confidence: avgConfidence,
      score,
    };
  }

  start(onTrade: (trade: any) => void) {
    if (this.interval) return;

    this.interval = setInterval(() => {
      // 1. UPDATE MARKET
      this.market = this.market.map((t) =>
        this.simulateMarketTick(t)
      );

      // 2. PICK RANDOM ASSET
      const asset =
        this.market[Math.floor(Math.random() * this.market.length)];

      // 3. MULTI-AGENT SYSTEM
      const macro = MacroAgent.analyze() as AgentVote;
      const quant = QuantAgent.analyze(asset) as AgentVote;
      const news = NewsAgent.analyze() as AgentVote;

      const riskVote: AgentVote = (() => {
        if (asset.changePct < -1.5)
          return { sentiment: "BEARISH", confidence: 70, reason: "Price drawdown risk" };
        if (asset.changePct > 1.5)
          return { sentiment: "BULLISH", confidence: 60, reason: "Strong momentum" };
        return { sentiment: "NEUTRAL", confidence: 50, reason: "Stable outlook" };
      })();

      const votes: AgentVote[] = [macro, quant, riskVote, news];

      // 4. AGGREGATE CONSENSUS
      const consensus = this.aggregateVotes(votes);

      // 5. FINAL DECISION INPUT
      const decision = StrategyEngine.generateDecision(asset, {
        symbol: asset.symbol,
        sentiment: consensus.sentiment,
        confidence: consensus.confidence,
      });

      if (decision.action === "HOLD") return;

      // 6. EMIT TRADE
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