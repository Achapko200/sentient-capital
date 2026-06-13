// ─── trader.ts ───────────────────────────────────────────────────────────────
// Execution helper: translates a decision + risk report into a concrete order.

import type { TradeAction } from "@/types";
import type { RiskReport }  from "@/lib/risk";

export type Order = {
  symbol:    string;
  action:    TradeAction;
  sizePct:   number;
  rationale: string;
};

export function buildOrder(
  symbol:    string,
  signal:    "bullish" | "bearish" | "neutral",
  riskReport: RiskReport,
  currentSizePct: number = 0,
): Order {
  // Risk override: if CRITICAL risk, always reduce regardless of signal
  if (riskReport.level === "CRITICAL") {
    return {
      symbol,
      action:    "SELL",
      sizePct:   Math.min(currentSizePct, 10),
      rationale: `Risk override (${riskReport.level}): ${riskReport.recommendation}`,
    };
  }

  if (signal === "bullish" && riskReport.level !== "HIGH") {
    const size = riskReport.level === "MEDIUM" ? 5 : 10;
    return {
      symbol,
      action:    "BUY",
      sizePct:   size,
      rationale: `Bullish signal confirmed, risk ${riskReport.level} — adding ${size}%`,
    };
  }

  if (signal === "bearish") {
    const size = currentSizePct > 0 ? Math.min(currentSizePct, 8) : 0;
    return {
      symbol,
      action:    size > 0 ? "SELL" : "HEDGE",
      sizePct:   size > 0 ? size : 5,
      rationale: `Bearish signal — ${size > 0 ? `reducing position by ${size}%` : "hedging via puts"}`,
    };
  }

  return {
    symbol,
    action:    "HOLD",
    sizePct:   0,
    rationale: "Neutral signal with no strong directional edge",
  };
}
