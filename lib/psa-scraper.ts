// Real PSA Population Report scraper
// PSA doesn't have a public API so we scrape their public web pages

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type RealPSAData = {
  psa10Count:   number;
  psa9Count:    number;
  totalGraded:  number;
  psa10Percent: number;
  rarity:       "ultra-rare" | "rare" | "uncommon" | "common";
  source:       "psa" | "estimated";
};

// Search PSA population by player name + card name
export async function fetchRealPSAPopulation(
  playerName: string,
  cardName:   string,
): Promise<RealPSAData | null> {
  const cacheKey = `psa:real:${playerName.toLowerCase().replace(/\s+/g, "-")}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached as RealPSAData;
  } catch {}

  try {
    // PSA population search endpoint
    const query   = encodeURIComponent(`${playerName} ${cardName}`);
    const res     = await fetch(
      `https://www.psacard.com/pop/api/population?q=${query}`,
      {
        headers: {
          "User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept":          "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer":         "https://www.psacard.com/pop/",
          "Origin":          "https://www.psacard.com",
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) throw new Error(`PSA API returned ${res.status}`);

    const data    = await res.json();
    const result  = parsePSAData(data);

    if (result) {
      await redis.set(cacheKey, result, { ex: 86400 });
    }
    return result;
  } catch {
    // Try alternate PSA endpoint
    return await fetchPSAAlternate(playerName, cardName);
  }
}

async function fetchPSAAlternate(playerName: string, cardName: string): Promise<RealPSAData | null> {
  try {
    // PSA SMR price guide also has population data
    const query = encodeURIComponent(playerName);
    const res   = await fetch(
      `https://www.psacard.com/smrpriceguide/search?q=${query}&type=Baseball`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept":     "application/json",
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return parsePSAData(data);
  } catch {
    return null;
  }
}

function parsePSAData(data: any): RealPSAData | null {
  try {
    // Try different response shapes from PSA
    const grades =
      data?.grades ??
      data?.population ??
      data?.data?.grades ??
      data?.results?.[0]?.grades ??
      null;

    if (!grades) return null;

    const psa10  = Number(grades["10"] ?? grades["PSA 10"] ?? grades["GEM-MT 10"] ?? 0);
    const psa9   = Number(grades["9"]  ?? grades["PSA 9"]  ?? grades["MINT 9"]    ?? 0);
    const total  = Object.values(grades).reduce((a, b) => Number(a) + Number(b), 0) as number;
    const pct10  = total > 0 ? Math.round((psa10 / total) * 100) : 0;

    return {
      psa10Count:   psa10,
      psa9Count:    psa9,
      totalGraded:  total,
      psa10Percent: pct10,
      rarity:       getRarity(psa10),
      source:       "psa",
    };
  } catch {
    return null;
  }
}

function getRarity(psa10Count: number): RealPSAData["rarity"] {
  if (psa10Count < 50)   return "ultra-rare";
  if (psa10Count < 500)  return "rare";
  if (psa10Count < 2000) return "uncommon";
  return "common";
}
