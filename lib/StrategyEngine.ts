// ─── StrategyEngine.ts ───────────────────────────────────────────────────────
// Consensus aggregator + trade decision generator.

import type { AgentVote, TradeAction } from "@/types";

export type TradeDecision = {
  symbol: string;
  action: TradeAction;
  size: number;
  confidence: number;
  reason: string;
  agentReasons: string[];
};

type WeightedVote = AgentVote & { weight: number };

export class StrategyEngine {
  // Agent weights — how much each agent's vote influences the consensus
  static readonly WEIGHTS = {
    macro: 0.30,
    quant: 0.35,
    news:  0.20,
    risk:  0.15,
  };

  static aggregate(votes: WeightedVote[]): {
    score: number;
    confidence: number;
    sentiment: AgentVote["sentiment"];
  } {
    let score = 0;
    let weightedConfidence = 0;
    let totalWeight = 0;

    for (const v of votes) {
      const direction =
        v.sentiment === "BULLISH" ? 1 :
        v.sentiment === "BEARISH" ? -1 : 0;

      score             += direction * v.weight * (v.confidence / 100);
      weightedConfidence += v.confidence * v.weight;
      totalWeight        += v.weight;
    }

    const avgConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 50;

    const sentiment: AgentVote["sentiment"] =
      score > 0.25  ? "BULLISH" :
      score < -0.25 ? "BEARISH" : "NEUTRAL";

    return { score, confidence: avgConfidence, sentiment };
  }

  static generateDecision(
    symbol: string,
    price: number,
    changePct: number,
    macroVote: AgentVote,
    quantVote: AgentVote,
    newsVote:  AgentVote,
    riskVote:  AgentVote,
  ): TradeDecision {
    const votes: WeightedVote[] = [
      { ...macroVote, weight: this.WEIGHTS.macro },
      { ...quantVote, weight: this.WEIGHTS.quant },
      { ...newsVote,  weight: this.WEIGHTS.news  },
      { ...riskVote,  weight: this.WEIGHTS.risk  },
    ];

    const { score, confidence, sentiment } = this.aggregate(votes);

    // Price momentum nudge on top of agent consensus
    const momentumBoost = changePct > 2 ? 0.08 : changePct < -2 ? -0.08 : 0;
    const finalScore    = score + momentumBoost;

    // Decision thresholds
    let action: TradeAction = "HOLD";
    let size = 0;

    if (finalScore > 0.40 && confidence > 60) {
      action = "BUY";
      size   = Math.min(20, confidence * 0.20);
    } else if (finalScore < -0.40 && confidence > 60) {
      action = "SELL";
      size   = Math.min(20, confidence * 0.20);
    } else if (finalScore < -0.25 && riskVote.sentiment === "BEARISH") {
      action = "HEDGE";
      size   = Math.min(10, confidence * 0.10);
    }

    const agentReasons = [
      macroVote.reason,
      quantVote.reason,
      newsVote.reason,
      riskVote.reason,
    ];

    const reason = this.buildReason(action, sentiment, finalScore, agentReasons);

    return {
      symbol,
      action,
      size:   Number(size.toFixed(2)),
      confidence: Math.round(confidence),
      reason,
      agentReasons,
    };
  }

  private static buildReason(
    action: TradeAction,
    sentiment: AgentVote["sentiment"],
    score: number,
    agentReasons: string[],
  ): string {
    if (action === "HOLD") return "No strong edge — agents divided, holding position";
    if (action === "HEDGE") return "Bearish risk signal with insufficient bull conviction to sell outright";

    // Find the most informative non-generic reason
    const bestReason = agentReasons.find((r) =>
      !r.includes("Insufficient") && r.length > 20
    ) ?? agentReasons[0];

    if (action === "BUY")
      return `Strong ${sentiment.toLowerCase()} consensus (score ${score.toFixed(2)}) — ${bestReason}`;
    if (action === "SELL")
      return `${sentiment} pressure (score ${score.toFixed(2)}) — ${bestReason}`;

    return agentReasons[0] ?? "No reason";
  }
}