// ─── market.ts ───────────────────────────────────────────────────────────────

export const SYMBOLS = ["NVDA", "TSLA", "SPY", "AAPL", "BTC"] as const;
export type Symbol = typeof SYMBOLS[number];

export const marketNews: Record<string, string[]> = {
  NVDA: [
    "NVDA GPU demand surges on AI infrastructure buildout",
    "NVIDIA faces export restrictions on H100 chips to China",
    "NVDA data center revenue beats estimates by 12%",
    "NVIDIA announces next-gen Blackwell architecture",
    "AI semiconductor supply chain tightness persists",
  ],
  TSLA: [
    "TSLA delivery numbers disappoint for third consecutive quarter",
    "Tesla Autopilot under fresh NHTSA investigation",
    "TSLA price cuts pressure margins again",
    "Tesla Full Self-Driving v13 shows improvement in safety metrics",
    "TSLA Cybertruck production ramp shows early signs of acceleration",
  ],
  SPY: [
    "Fed signals higher-for-longer rate stance at FOMC",
    "S&P 500 earnings season beats estimates across 70% of companies",
    "Consumer confidence index falls to six-month low",
    "Bond yields invert again, recession fears resurface",
    "Institutional inflows into equities accelerate for second week",
  ],
  AAPL: [
    "Apple Intelligence features drive upgrade supercycle speculation",
    "AAPL Services revenue hits all-time high",
    "Apple faces EU antitrust fine over App Store practices",
    "iPhone 17 pre-orders exceed analyst projections",
    "Apple Vision Pro sales disappoint; headcount cuts rumored",
  ],
  BTC: [
    "Bitcoin ETF inflows hit weekly record on institutional demand",
    "BTC miners capitulate ahead of halving pressure",
    "Bitcoin mempool congestion drives fees to 3-month high",
    "Macro headwinds weigh on crypto risk appetite",
    "BTC breaks above key $70k resistance with volume confirmation",
  ],
};

export function getNewsForSymbol(symbol: string): string {
  const pool = marketNews[symbol] ?? marketNews["SPY"];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomNews(): string {
  const all = Object.values(marketNews).flat();
  return all[Math.floor(Math.random() * all.length)];
}
