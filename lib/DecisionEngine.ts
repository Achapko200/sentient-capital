// ─── DecisionEngine.ts ───────────────────────────────────────────────────────
// Central decision loop. Runs every 2s, processes all assets, emits trade signals.

import { MacroAgent } from "@/lib/agents/Macro";
import { QuantAgent }  from "@/lib/agents/Quant";
import { NewsAgent }   from "@/lib/agents/News";
import { RiskAgent }   from "@/lib/agents/Risk";
import { StrategyEngine } from "@/lib/StrategyEngine";
import { getFundState }   from "@/lib/fundstore";
import type { TradeSignal } from "@/types";

type PositionMap = Record<string, { size: number }>;

export class DecisionEngine {
  private interval: ReturnType<typeof setInterval> | null = null;
  private positions: PositionMap = {};

  start(onTrade: (trade: TradeSignal) => void, onMark: () => void): void {
    if (this.interval) return;

    const tick = () => {
      const state  = getFundState();
      const assets = Object.values(state.assets);

      if (assets.length === 0) return;

      // Call mark-to-market each tick so equity curve updates
      onMark();

      for (const asset of assets) {
        const positionSize = this.positions[asset.symbol]?.size ?? 0;

        const macroVote = MacroAgent.analyze(asset);
        const quantVote = QuantAgent.analyze(asset);
        const newsVote  = NewsAgent.analyze(asset);
        const riskVote  = RiskAgent.analyze(asset, positionSize);

        const decision = StrategyEngine.generateDecision(
          asset.symbol,
          asset.price,
          asset.changePct,
          macroVote,
          quantVote,
          newsVote,
          riskVote,
        );

        if (decision.action === "HOLD") continue;

        // Track position sizes so RiskAgent can penalize concentration
        this.positions[asset.symbol] = {
          size: decision.action === "SELL"
            ? Math.max(0, positionSize - decision.size)
            : positionSize + decision.size,
        };

        const trade: TradeSignal = {
          id:         Date.now() + Math.random(),
          symbol:     decision.symbol,
          action:     decision.action,
          size:       decision.size,
          price:      asset.price,          // ← price always included now
          confidence: decision.confidence,
          reason:     decision.reason,
          time:       new Date().toLocaleTimeString(),
        };

        onTrade(trade);
      }
    };

    this.interval = setInterval(tick, 2000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
