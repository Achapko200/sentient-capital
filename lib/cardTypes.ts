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
  cardColor: string;   // team primary color for card design
  teamColor: string;   // team secondary color
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
  id:        string;
  title:     string;
  price:     number;
  date:      string;
  condition: string;
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
  player:      Player;
  stats:       MLBStats | null;
  sales:       EbaySale[];
  sentiment:   SentimentScore;
  cardSignal:  CardSignal;
  avgPrice:    number;
  priceChange: number;
  loading:     boolean;
  error:       string | null;
};
