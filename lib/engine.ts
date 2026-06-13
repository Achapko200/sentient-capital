export type Portfolio = {
  NVDA: number;
  MSFT: number;
  AAPL: number;
  CASH: number;
};

export type AgentSignal = {
  agent: string;
  action: string;
  confidence: number;
  reasoning: string;
};

export function runResearchAgent(portfolio: Portfolio) {
  return {
    agent: "research.aura.eth",
    action: "analyze",
    confidence: 0.82,
    reasoning: "NVDA volatility increasing, AI demand still strong",
  };
}

export function runRiskAgent(portfolio: Portfolio) {
  const exposure = portfolio.NVDA;

  return {
    agent: "risk.aura.eth",
    action: exposure > 30 ? "reduce_risk" : "hold",
    confidence: 0.88,
    reasoning:
      exposure > 30
        ? "Overexposed to NVDA"
        : "Risk within acceptable range",
  };
}

export function runTraderAgent(
  portfolio: Portfolio,
  riskSignal: AgentSignal
) {
  let updated = { ...portfolio };

  if (riskSignal.action === "reduce_risk") {
    updated.NVDA = Math.max(20, updated.NVDA - 8);
    updated.CASH += 8;
  }

  return {
    agent: "trader.aura.eth",
    action: "rebalance",
    confidence: 0.91,
    reasoning: "Executing risk-adjusted portfolio rebalance",
    portfolio: normalize(updated),
  };
}

function normalize(p: Portfolio): Portfolio {
  const total = p.NVDA + p.MSFT + p.AAPL + p.CASH;

  return {
    NVDA: Math.round((p.NVDA / total) * 100),
    MSFT: Math.round((p.MSFT / total) * 100),
    AAPL: Math.round((p.AAPL / total) * 100),
    CASH: Math.round((p.CASH / total) * 100),
  };
}