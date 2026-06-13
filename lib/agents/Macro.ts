// ─── agents/Macro.ts ─────────────────────────────────────────────────────────
// Macro agent: considers price level, rate environment, and sector conditions.

import type { AssetState, AgentVote } from "@/types";
import { getTrend } from "@/lib/indicators";

// Macro regime: randomly shifts on each analysis cycle to simulate
// changing macro conditions (rate expectations, liquidity, risk-on/off).
const macroRegimes = [
  { bias: "BULLISH",  weight: 0.6, reason: "Fed pivot signals rate cuts within 3 months, liquidity improving" },
  { bias: "BULLISH",  weight: 0.7, reason: "Strong payrolls and rising ISM support risk-on positioning" },
  { bias: "NEUTRAL",  weight: 0.5, reason: "Macro data mixed; awaiting CPI print before repositioning" },
  { bias: "BEARISH",  weight: 0.55, reason: "Yield curve inversion deepening — recession probability rising" },
  { bias: "BEARISH",  weight: 0.65, reason: "Fed higher-for-longer rhetoric pressuring equity multiples" },
] as const;

// Per-symbol macro sensitivity: some assets are more macro-sensitive than others
const macroSensitivity: Record<string, number> = {
  NVDA: 0.9,  // AI hype amplifies macro moves
  TSLA: 0.85,
  SPY:  1.0,  // pure macro proxy
  AAPL: 0.7,
  BTC:  1.1,  // high beta to macro risk appetite
};

export class MacroAgent {
  static analyze(asset: AssetState): AgentVote {
    const regime = macroRegimes[Math.floor(Math.random() * macroRegimes.length)];
    const sensitivity = macroSensitivity[asset.symbol] ?? 0.8;

    const prices = asset.history.map((h) => h.price);
    const trend  = getTrend(prices);

    // Adjust confidence based on trend alignment with macro regime
    let confidence = 50 + regime.weight * 30;
    if (regime.bias === "BULLISH" && trend === "UP")   confidence = Math.min(95, confidence + 10);
    if (regime.bias === "BEARISH" && trend === "DOWN") confidence = Math.min(95, confidence + 10);
    if (regime.bias === "BULLISH" && trend === "DOWN") confidence = Math.max(40, confidence - 12);
    if (regime.bias === "BEARISH" && trend === "UP")   confidence = Math.max(40, confidence - 12);

    confidence = confidence * sensitivity;

    let sentiment = regime.bias as AgentVote["sentiment"];

    // Override to NEUTRAL when confidence is very low
    if (confidence < 45) sentiment = "NEUTRAL";

    return {
      sentiment,
      confidence: Math.min(95, Math.max(35, confidence)),
      reason: `Macro: ${regime.reason}`,
    };
  }
}
