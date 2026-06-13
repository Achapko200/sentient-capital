import { MacroAgent } from "@/lib/agents/Macro";
import { QuantAgent } from "@/lib/agents/Quant";
import { NewsAgent } from "@/lib/agents/News";
import { StrategyEngine } from "@/lib/StrategyEngine";
import { getFundState } from "@/lib/fundstore";

type AgentVote = {
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  reason?: string;
};

export class FundEngine {
  private interval: any = null;

  private aggregateVotes(votes: AgentVote[]) {
    let score = 0;
    let confidenceSum = 0;

    for (const v of votes) {
      const weight = v.confidence / 100;

      confidenceSum += v.confidence;

      if (v.sentiment === "BULLISH") score += weight;
      if (v.sentiment === "BEARISH") score -= weight;
    }

    const avgConfidence =
      votes.length > 0 ? confidenceSum / votes.length : 0;

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
      // 1. GET PORTFOLIO STATE
      const state = getFundState();
      const assets = Object.values(state.assets || {});

      if (assets.length === 0) return;

      // 2. PROCESS EACH ASSET INDEPENDENTLY
      for (const asset of assets) {
        const macro = MacroAgent.analyze(asset) as AgentVote;
        const quant = QuantAgent.analyze(asset) as AgentVote;
        const news = NewsAgent.analyze(asset) as AgentVote;

        // 3. RISK MODEL
        const riskVote: AgentVote =
          asset.price > 400
            ? {
                sentiment: "BEARISH",
                confidence: 60,
                reason: "Overheated asset level",
              }
            : asset.price < 200
            ? {
                sentiment: "BULLISH",
                confidence: 65,
                reason: "Undervalued zone detected",
              }
            : {
                sentiment: "NEUTRAL",
                confidence: 50,
                reason: "Fair market range",
              };

        const votes: AgentVote[] = [
          macro,
          quant,
          riskVote,
          news,
        ];

        // 4. CONSENSUS ENGINE
        const consensus = this.aggregateVotes(votes);

        const marketData = {
          ...asset,
          changePct: (asset as any).changePct ?? 0,
        };

        // 5. STRATEGY DECISION
        const decision = StrategyEngine.generateDecision(
          marketData,
          {
            symbol: asset.symbol,
            sentiment: consensus.sentiment,
            confidence: consensus.confidence,
          }
        );

        if (decision.action === "HOLD") continue;

        // 6. EMIT TRADE
        onTrade({
          id: Date.now() + Math.random(),
          symbol: decision.symbol,
          action: decision.action,
          size: decision.size,
          confidence: decision.confidence,
          reason: decision.reason,
          time: new Date().toLocaleTimeString(),
        });
      }
    }, 2000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}