import { Redis }                  from "@upstash/redis";
import { fetchRealPSAPopulation } from "./psa-scraper";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type PSAPopulation = {
  playerName:   string;
  cardName:     string;
  psa10Count:   number;
  psa9Count:    number;
  totalGraded:  number;
  psa10Percent: number;
  rarity:       "ultra-rare" | "rare" | "uncommon" | "common";
  source:       "psa" | "estimated";
  lastUpdated:  string;
};

export async function getPSAPopulation(
  playerId: string,
  cardName: string,
  playerName?: string,
): Promise<PSAPopulation | null> {
  const cacheKey = `psa:pop:v2:${playerId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached as PSAPopulation;
  } catch {}

  // Try real PSA data first
  if (playerName && cardName) {
    const real = await fetchRealPSAPopulation(playerName, cardName);
    if (real) {
      const result: PSAPopulation = {
        playerName,
        cardName,
        ...real,
        lastUpdated: new Date().toISOString(),
      };
      try { await redis.set(cacheKey, result, { ex: 86400 }); } catch {}
      return result;
    }
  }

  // Fallback to estimation
  return generateEstimatedPopulation(playerId, cardName, playerName ?? "");
}

function generateEstimatedPopulation(
  playerId: string,
  cardName: string,
  playerName: string,
): PSAPopulation {
  const id       = parseInt(playerId);
  const isModern = cardName.includes("202") || cardName.includes("201");
  const isTopStar = ["Ohtani", "Acuna", "Soto", "Judge", "Trout"]
    .some(n => playerName.includes(n));

  // Realistic estimates based on card era
  const psa10Count = isModern
    ? isTopStar ? 800 + Math.floor(id % 1200)
                : 100 + Math.floor(id % 400)
    : 20 + Math.floor(id % 150);

  const totalGraded  = Math.floor(psa10Count * (3 + (id % 4)));
  const psa10Percent = Math.round((psa10Count / totalGraded) * 100);

  return {
    playerName,
    cardName,
    psa10Count,
    psa9Count:    Math.floor(psa10Count * 1.4),
    totalGraded,
    psa10Percent,
    rarity:       getRarity(psa10Count),
    source:       "estimated",
    lastUpdated:  new Date().toISOString(),
  };
}

function getRarity(psa10Count: number): PSAPopulation["rarity"] {
  if (psa10Count < 50)   return "ultra-rare";
  if (psa10Count < 500)  return "rare";
  if (psa10Count < 2000) return "uncommon";
  return "common";
}

export function getRarityImpact(pop: PSAPopulation): number {
  if (pop.rarity === "ultra-rare") return 2.5;
  if (pop.rarity === "rare")       return 1.8;
  if (pop.rarity === "uncommon")   return 1.3;
  return 1.0;
}

export function getRaritySignal(pop: PSAPopulation): "BUY" | "HOLD" | "SELL" {
  if (pop.rarity === "ultra-rare") return "BUY";
  if (pop.rarity === "rare")       return "BUY";
  return "HOLD";
}
