// ─── lib/cardTypes.ts ────────────────────────────────────────────────────────

export type Signal = "BUY" | "SELL" | "HOLD";

export type Player = {
  id:       string;   // MLB player ID
  name:     string;
  team:     string;
  position: string;
  cardName: string;   // e.g. "2023 Topps Chrome PSA 10"
  image:    string;   // emoji fallback
};

export type MLBStats = {
  avg:     number;
  hr:      number;
  rbi:     number;
  ops:     number;
  hits:    number;
  games:   number;
  lastGame: {
    date:  string;
    hits:  number;
    hr:    number;
    rbi:   number;
    avg:   number;
  } | null;
};

export type EbaySale = {
  id:       string;
  title:    string;
  price:    number;
  date:     string;
  condition: string;
};

export type SentimentScore = {
  score:    number;   // 0-100
  label:    "VERY BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "VERY BEARISH";
  reasons:  string[];
};

export type CardSignal = {
  signal:     Signal;
  confidence: number;
  reasons:    string[];
  buyBelow:   number | null;
  sellAbove:  number | null;
};

export type CardData = {
  player:     Player;
  stats:      MLBStats | null;
  sales:      EbaySale[];
  sentiment:  SentimentScore;
  cardSignal: CardSignal;
  avgPrice:   number;
  priceChange: number; // % change last 7 days
  loading:    boolean;
  error:      string | null;
};
