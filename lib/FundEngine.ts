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
      // 1. GET LIVE STATE FROM STORE
      const state = getFundState();

      if (!state.symbol || !state.price) return;

      const asset = {
        symbol: state.symbol,
        price: state.price,
        changePct: 0,
      };

      // 2. MULTI-AGENT SYSTEM
      const macro = MacroAgent.analyze() as AgentVote;
      const quant = QuantAgent.analyze(asset) as AgentVote;
      const news = NewsAgent.analyze() as AgentVote;

      // 3. RISK ENGINE (simple but deterministic)
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

      const votes: AgentVote[] = [macro, quant, riskVote, news];

      // 4. CONSENSUS ENGINE
      const consensus = this.aggregateVotes(votes);

      // 5. STRATEGY DECISION
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