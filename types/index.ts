export type AgentSentiment = "BULLISH" | "BEARISH" | "NEUTRAL";

export type AgentVote = {
  sentiment: AgentSentiment;
  confidence: number;
  reason?: string;
};

export type TradeAction = "BUY" | "SELL" | "HOLD" | "HEDGE";

export type TradeSignal = {
  id: number;
  symbol: string;
  action: TradeAction;
  size: number;
  price: number;
  confidence: number;
  reason: string;
  time: string;
};

export type Position = {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
};

export type MarketTick = {
  symbol: string;
  price: number;
  changePct: number;
};

export type PricePoint = {
  price: number;
  time: number;
};

export type AssetState = {
  symbol: string;
  price: number;
  history: PricePoint[];
  insight: string;
  decision: string;
  changePct?: number;
};

export type FundState = {
  assets: Record<string, AssetState>;
};
