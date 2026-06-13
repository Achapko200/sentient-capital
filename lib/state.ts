type LoopState = {
  lastRun: string | null;
  news: string;
  insight: string;
  riskScore: number;
  decision: string;
};

export const state: LoopState = {
  lastRun: null,
  news: "",
  insight: "",
  riskScore: 0,
  decision: "INITIALIZING",
};