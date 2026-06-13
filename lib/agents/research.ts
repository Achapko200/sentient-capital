// ─── research.ts ─────────────────────────────────────────────────────────────
// Server-side AI research loop state. Used by /api/analyze/loop routes.

export type ResearchState = {
  lastRun:   string | null;
  symbol:    string;
  news:      string;
  insight:   string;
  signal:    "bullish" | "bearish" | "neutral";
  riskScore: number;
  decision:  "BUY" | "SELL" | "HOLD";
};

class ResearchStore {
  private state: ResearchState = {
    lastRun:   null,
    symbol:    "",
    news:      "",
    insight:   "Initializing research agents…",
    signal:    "neutral",
    riskScore: 50,
    decision:  "HOLD",
  };

  get(): ResearchState {
    return { ...this.state };
  }

  update(partial: Partial<ResearchState>): void {
    this.state = { ...this.state, ...partial, lastRun: new Date().toISOString() };
  }
}

export const researchStore = new ResearchStore();
