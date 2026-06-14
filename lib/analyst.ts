export type AnalystRating = "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";
 
export type Analyst = {
  name:      string;
  firm:      string;
  avatar:    string;
  specialty: string;
};
 
export type AnalystCall = {
  analyst:     Analyst;
  rating:      AnalystRating;
  priceTarget: number;
  currentPrice: number;
  upside:      number;
  thesis:      string;
  date:        string;
  timeframe:   string;
};
 
export type CardAnalysis = {
  playerId:     string;
  playerName:   string;
  consensusRating: AnalystRating;
  avgPriceTarget: number;
  calls:        AnalystCall[];
};
 
const ANALYSTS: Analyst[] = [
  { name: "Mike Torres",   firm: "CardAlpha Research", avatar: "🎓", specialty: "Rookies & Prospects" },
  { name: "Sarah Chen",    firm: "Diamond Grade LLC",  avatar: "💎", specialty: "Vintage & HOF Cards" },
  { name: "James Wright",  firm: "Beckett Analytics",  avatar: "📊", specialty: "Market Timing" },
];
 
export const ANALYST_RATINGS: Record<string, CardAnalysis> = {
  "683002": {
    playerId: "683002",
    playerName: "Paul Skenes",
    consensusRating: "STRONG BUY",
    avgPriceTarget: 420,
    calls: [
      { analyst: ANALYSTS[0], rating: "STRONG BUY", priceTarget: 450, currentPrice: 280, upside: 60.7, thesis: "Generational pitching talent. Cy Young favorite. Chrome rookie PSA 10 pop is still low — supply constraint will push prices higher all season.", date: "Jun 10, 2025", timeframe: "6–12 months" },
      { analyst: ANALYSTS[2], rating: "BUY",        priceTarget: 380, currentPrice: 280, upside: 35.7, thesis: "Strong momentum play. Price consolidating after initial hype — now entering new leg up as playoff push begins. Volume confirms buyers in control.", date: "Jun 8, 2025",  timeframe: "3–6 months" },
    ],
  },
  "682998": {
    playerId: "682998",
    playerName: "Jackson Holliday",
    consensusRating: "HOLD",
    avgPriceTarget: 105,
    calls: [
      { analyst: ANALYSTS[0], rating: "BUY",  priceTarget: 120, currentPrice: 95, upside: 26.3, thesis: "Bounce-back story forming. Recent stats show him finally hitting his stride. Bowman autos undervalued at current levels given ceiling.", date: "Jun 9, 2025",  timeframe: "6–12 months" },
      { analyst: ANALYSTS[2], rating: "HOLD", priceTarget: 90,  currentPrice: 95, upside: -5.3, thesis: "Mixed performance makes timing difficult. Wait for sustained 3-week hot streak before adding. Current price fairly reflects uncertainty.", date: "Jun 5, 2025",  timeframe: "1–3 months" },
    ],
  },
  "671939": {
    playerId: "671939",
    playerName: "Gunnar Henderson",
    consensusRating: "BUY",
    avgPriceTarget: 240,
    calls: [
      { analyst: ANALYSTS[0], rating: "BUY",        priceTarget: 250, currentPrice: 185, upside: 35.1, thesis: "Best SS in the AL. Cards trading at a discount to his actual production. Orioles playoff contention will push demand late in season.", date: "Jun 11, 2025", timeframe: "3–6 months" },
      { analyst: ANALYSTS[1], rating: "STRONG BUY", priceTarget: 230, currentPrice: 185, upside: 24.3, thesis: "Chrome Topps PSA 10 at this price is a steal. Comparable players trade 40% higher. Strong fundamentals, clean card supply.", date: "Jun 7, 2025",  timeframe: "6–12 months" },
    ],
  },
  "660670": {
    playerId: "660670",
    playerName: "Ronald Acuña Jr.",
    consensusRating: "STRONG BUY",
    avgPriceTarget: 580,
    calls: [
      { analyst: ANALYSTS[1], rating: "STRONG BUY", priceTarget: 600, currentPrice: 420, upside: 42.9, thesis: "Coming off injury, hitting .290+ and showing MVP form again. 2018 Topps Update rookie PSA 10 is the definitive Acuña card. Still underpriced relative to peak.", date: "Jun 12, 2025", timeframe: "12+ months" },
      { analyst: ANALYSTS[2], rating: "STRONG BUY", priceTarget: 560, currentPrice: 420, upside: 33.3, thesis: "Technical breakout above $400 resistance. Volume surge confirms institutional buyers returning. Target $560 within 6 months.", date: "Jun 10, 2025", timeframe: "6 months" },
    ],
  },
  "808967": {
    playerId: "808967",
    playerName: "Wyatt Langford",
    consensusRating: "HOLD",
    avgPriceTarget: 80,
    calls: [
      { analyst: ANALYSTS[0], rating: "HOLD", priceTarget: 90, currentPrice: 75, upside: 20.0, thesis: "High ceiling, inconsistent floor. Langford has the talent but not yet delivering consistently. Hold current positions, wait for clearer signal.", date: "Jun 8, 2025",  timeframe: "3 months" },
      { analyst: ANALYSTS[2], rating: "HOLD", priceTarget: 70, currentPrice: 75, upside: -6.7, thesis: "Slightly overpriced given production level. Not a sell — but don't add at current levels. Better entry points likely ahead.", date: "Jun 6, 2025",  timeframe: "1–3 months" },
    ],
  },
  "694973": {
    playerId: "694973",
    playerName: "Julio Rodriguez",
    consensusRating: "BUY",
    avgPriceTarget: 190,
    calls: [
      { analyst: ANALYSTS[0], rating: "BUY",  priceTarget: 195, currentPrice: 145, upside: 34.5, thesis: "J-Rod quietly having a great year. Cards lagging real performance — classic accumulation opportunity before broader market catches on.", date: "Jun 11, 2025", timeframe: "3–6 months" },
      { analyst: ANALYSTS[1], rating: "BUY",  priceTarget: 185, currentPrice: 145, upside: 27.6, thesis: "2022 Chrome rookie PSA 10 at $145 is attractive. Mariners in playoff hunt adds seasonal catalyst. Low risk, solid upside.", date: "Jun 9, 2025",  timeframe: "6 months" },
    ],
  },
};
 
export function getAnalysis(playerId: string): CardAnalysis | null {
  return ANALYST_RATINGS[playerId] ?? null;
}
 
export function getAllAnalyses(): CardAnalysis[] {
  return Object.values(ANALYST_RATINGS);
}
 