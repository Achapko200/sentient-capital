import type { MLBStats } from "@/lib/cardTypes";

export type AnalystRating = "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";

export type Analyst = {
  name:      string;
  firm:      string;
  avatar:    string;
  specialty: string;
};

export type AnalystCall = {
  analyst:      Analyst;
  rating:       AnalystRating;
  priceTarget:  number;
  currentPrice: number;
  upside:       number;
  thesis:       string;
  date:         string;
  timeframe:    string;
};

export type CardAnalysis = {
  playerId:        string;
  playerName:      string;
  consensusRating: AnalystRating;
  avgPriceTarget:  number;
  calls:           AnalystCall[];
};

const ANALYSTS: Analyst[] = [
  { name: "Mike Torres",  firm: "CardAlpha Research", avatar: "🎓", specialty: "Rookies & Prospects" },
  { name: "Sarah Chen",   firm: "Diamond Grade LLC",  avatar: "💎", specialty: "Vintage & HOF Cards"  },
  { name: "James Wright", firm: "Beckett Analytics",  avatar: "📊", specialty: "Market Timing"        },
];

// ─── Derive rating from live stats ────────────────────────────────────────────
function deriveRating(stats: MLBStats | null): AnalystRating {
  if (!stats) return "HOLD";
  if (stats.ops >= 0.950 && stats.hr >= 20) return "STRONG BUY";
  if (stats.ops >= 0.850 || stats.hr >= 15) return "BUY";
  if (stats.ops < 0.600 || stats.avg < 0.200) return "STRONG SELL";
  if (stats.ops < 0.680 || stats.avg < 0.230) return "SELL";
  return "HOLD";
}

// ─── Build thesis from live stats ────────────────────────────────────────────
function buildThesis(name: string, stats: MLBStats | null, rating: AnalystRating, analyst: Analyst): string {
  if (!stats) return `${name} card value tracking with performance recovery. Monitoring closely.`;

  const avg = `.${Math.round(stats.avg * 1000)}`;
  const ops = stats.ops.toFixed(3);

  if (analyst.specialty === "Rookies & Prospects") {
    if (rating === "STRONG BUY") return `${name} is posting generational numbers — ${stats.hr} HR, OPS ${ops}. Chrome rookie PSA 10 supply is tight. Prices moving higher all season.`;
    if (rating === "BUY")        return `${name} showing the production to justify card prices. Batting ${avg} with ${stats.hr} HR — solid entry point before broader market catches on.`;
    if (rating === "HOLD")       return `${name} mixed signals this season. Hold current positions, wait for a sustained hot streak before adding more.`;
    return `${name} underperforming at ${avg} AVG. Reduce exposure until numbers improve over a 3-week window.`;
  }

  if (analyst.specialty === "Market Timing") {
    if (rating === "STRONG BUY") return `Technical breakout confirmed. OPS ${ops} with ${stats.hr} HR driving institutional demand. Volume surge signals new leg up — target +40% from current levels.`;
    if (rating === "BUY")        return `Momentum building. ${stats.hr} HR pace and ${avg} AVG creating favorable risk/reward. Price consolidation ending — new buyers stepping in.`;
    if (rating === "HOLD")       return `Mixed performance makes timing difficult. Current price fairly reflects ${avg} AVG. Wait for clearer directional signal before acting.`;
    return `Bearish momentum developing. OPS ${ops} below threshold. Sell into any strength — better re-entry points likely ahead.`;
  }

  // Vintage & HOF specialist
  if (rating === "STRONG BUY") return `${name} cementing legacy numbers — ${stats.hr} HR, OPS ${ops}. Card is the definitive issue and still underpriced relative to career arc.`;
  if (rating === "BUY")        return `${name} producing at a level that justifies premium card prices. Clean supply and strong demand fundamentals.`;
  if (rating === "HOLD")       return `${name} card fairly valued at current price given ${avg} AVG. Keep existing positions, do not add.`;
  return `Performance decline at ${avg} AVG warrants caution. Consider reducing position size.`;
}

// ─── Generate analysis dynamically from live stats ────────────────────────────
export function getAnalysis(
  playerId:   string,
  playerName: string,
  stats:      MLBStats | null,
  avgPrice:   number,
): CardAnalysis {
  const consensusRating = deriveRating(stats);
  const targetMultiplier =
    consensusRating === "STRONG BUY"  ? 1.45 :
    consensusRating === "BUY"         ? 1.25 :
    consensusRating === "HOLD"        ? 1.08 :
    consensusRating === "SELL"        ? 0.88 : 0.75;

  const avgPriceTarget = Math.round(avgPrice * targetMultiplier);
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const calls: AnalystCall[] = ANALYSTS.map((analyst, i) => {
    // Give each analyst slightly different price targets for realism
    const variance   = [1.0, 0.94, 1.06][i];
    const target     = Math.round(avgPriceTarget * variance);
    const upside     = Math.round(((target - avgPrice) / avgPrice) * 1000) / 10;
    const timeframes = ["6–12 months", "3–6 months", "6 months"];

    // Vary ratings slightly between analysts
    const ratings: AnalystRating[] =
      consensusRating === "STRONG BUY" ? ["STRONG BUY", "BUY", "STRONG BUY"] :
      consensusRating === "BUY"        ? ["BUY", "BUY", "HOLD"] :
      consensusRating === "HOLD"       ? ["BUY", "HOLD", "HOLD"] :
      consensusRating === "SELL"       ? ["HOLD", "SELL", "SELL"] :
                                         ["SELL", "STRONG SELL", "SELL"];

    return {
      analyst,
      rating:       ratings[i],
      priceTarget:  target,
      currentPrice: avgPrice,
      upside,
      thesis:       buildThesis(playerName, stats, ratings[i], analyst),
      date:         today,
      timeframe:    timeframes[i],
    };
  });

  return { playerId, playerName, consensusRating, avgPriceTarget, calls };
}

// ─── getAllAnalyses removed — no longer needed since analysis is generated
// ─── per-player on demand from the API route using live stats + prices
 