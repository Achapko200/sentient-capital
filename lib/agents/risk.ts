// ─── risk.ts ─────────────────────────────────────────────────────────────────
// Server-side portfolio risk scoring used by /api/analyze/risk.

export type PortfolioSnapshot = {
  [symbol: string]: number; // symbol → position size %
};

export type RiskReport = {
  score:       number;  // 0–100
  level:       "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  warnings:    string[];
  recommendation: string;
};

// Per-symbol beta to S&P 500
const BETA: Record<string, number> = {
  NVDA: 1.7,
  TSLA: 2.0,
  AAPL: 1.1,
  SPY:  1.0,
  BTC:  3.2,
};

export function scorePortfolio(portfolio: PortfolioSnapshot): RiskReport {
  const warnings: string[] = [];
  let score = 0;

  const symbols = Object.keys(portfolio);
  const total   = symbols.reduce((s, k) => s + portfolio[k], 0);

  // Concentration risk
  for (const sym of symbols) {
    const pct  = portfolio[sym];
    const beta = BETA[sym] ?? 1.2;
    score += pct * beta * 0.8;

    if (pct > 35) warnings.push(`${sym} is overconcentrated at ${pct}%`);
    if (beta > 1.5 && pct > 20) warnings.push(`${sym} is high-beta (${beta}) with large exposure`);
  }

  // Cash check
  const cash = 100 - total;
  if (cash < 10) { score += 15; warnings.push("Cash buffer below 10% — limited dry powder"); }

  score = Math.min(100, Math.max(0, score));

  const level: RiskReport["level"] =
    score >= 80 ? "CRITICAL" :
    score >= 60 ? "HIGH" :
    score >= 40 ? "MEDIUM" : "LOW";

  const recommendation =
    score >= 80 ? "Immediately reduce exposure across high-beta positions" :
    score >= 60 ? "Trim largest positions and raise cash buffer" :
    score >= 40 ? "Monitor closely — consider light hedges via SPY puts" :
    "Risk within acceptable parameters — maintain current allocation";

  return { score: Math.round(score), level, warnings, recommendation };
}
