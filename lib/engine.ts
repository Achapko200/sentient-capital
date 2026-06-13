export type Portfolio = {
  nvda: number;
  msft: number;
  aapl: number;
  cash: number;
};

export function runRiskEngine(portfolio: Portfolio) {
  const riskScore =
    portfolio.nvda * 1.2 +
    portfolio.msft * 0.6 +
    portfolio.aapl * 0.7;

  if (riskScore > 60) {
    return {
      decision: "Reduce NVDA exposure by 10%",
      reason: "Overconcentration detected in high-volatility AI sector",
      confidence: 87,
    };
  }

  return {
    decision: "Maintain current allocation",
    reason: "Risk within acceptable threshold",
    confidence: 76,
  };
}