// ─── lib/cardTypes.ts ────────────────────────────────────────────────────────

export type Signal = "BUY" | "SELL" | "HOLD";

export type Player = {
  id:        string;
  name:      string;
  team:      string;
  position:  string;
  cardName:  string;
  image:     string;
  cardImage: string;
  cardColor: string;
  teamColor: string;
};

export type MLBStats = {
  avg:     number;
  hr:      number;
  rbi:     number;
  ops:     number;
  hits:    number;
  games:   number;
  lastGame: {
    date: string;
    hits: number;
    hr:   number;
    rbi:  number;
    avg:  number;
  } | null;
};

export type EbaySale = {
  id:        string;
  title:     string;
  price:     number;
  date:      string;
  condition: string;
};

export type PriceHistory = {
  week:       { current: number; previous: number; changePct: number };
  threeMonth: { current: number; previous: number; changePct: number };
  year:       { current: number; previous: number; changePct: number };
};

export type LiquidityScore = {
  score:         number;
  label:         "VERY LIQUID" | "LIQUID" | "MODERATE" | "THIN" | "ILLIQUID";
  salesPerMonth: number;
  daysToSell:    number;
  color:         string;
};

export type SentimentScore = {
  score:   number;
  label:   "VERY BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "VERY BEARISH";
  reasons: string[];
};

export type CardSignal = {
  signal:     Signal;
  confidence: number;
  reasons:    string[];
  buyBelow:   number | null;
  sellAbove:  number | null;
};

export type CardData = {
  player:       Player;
  stats:        MLBStats | null;
  sales:        EbaySale[];
  priceHistory: PriceHistory;
  liquidity:    LiquidityScore;
  sentiment:    SentimentScore;
  cardSignal:   CardSignal;
  avgPrice:     number;
  priceChange:  number;
  loading:      boolean;
  error:        string | null;
};