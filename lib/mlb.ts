// ─── lib/mlb.ts ──────────────────────────────────────────────────────────────
// Fetches real player stats from the free MLB Stats API — no key required.

import type { MLBStats } from "@/lib/cardTypes";

const BASE = "https://statsapi.mlb.com/api/v1";

type RawGameLog = {
  stat: {
    avg:  string;
    homeRuns: number;
    rbi:  number;
    ops:  string;
    hits: number;
  };
  date: string;
};

type RawSeason = {
  stat: {
    avg:      string;
    homeRuns: number;
    rbi:      number;
    ops:      string;
    hits:     number;
    gamesPlayed: number;
  };
};

export async function fetchMLBStats(playerId: string): Promise<MLBStats | null> {
  try {
    const currentYear = new Date().getFullYear();
    let statsSeason = currentYear;
    let season: RawSeason | undefined;

    // Use this season when available, otherwise fall back to the most recent
    // completed season (useful before Opening Day and for historical players).
    for (const year of [currentYear, currentYear - 1]) {
      const seasonRes = await fetch(
        `${BASE}/people/${playerId}/stats?stats=season&season=${year}&group=hitting`,
        { next: { revalidate: 300 } },
      );
      if (!seasonRes.ok) continue;
      const seasonJson = await seasonRes.json();
      const foundSeason: RawSeason | undefined = seasonJson?.stats?.[0]?.splits?.[0];
      if (foundSeason) {
        season = foundSeason;
        statsSeason = year;
        break;
      }
    }
    if (!season) return null;

    // Last game log for the season represented by the stats.
    const logRes = await fetch(
      `${BASE}/people/${playerId}/stats?stats=gameLog&season=${statsSeason}&group=hitting`,
      { next: { revalidate: 300 } },
    );
    const logJson = await logRes.json();
    const gameLogs: RawGameLog[] = logJson?.stats?.[0]?.splits ?? [];
    const lastGame = gameLogs[0] ?? null;

    const s = season.stat;
    const lg = lastGame?.stat;

    return {
      season: statsSeason,
      avg:    parseFloat(s.avg) || 0,
      hr:     s.homeRuns ?? 0,
      rbi:    s.rbi ?? 0,
      ops:    parseFloat(s.ops) || 0,
      hits:   s.hits ?? 0,
      games:  s.gamesPlayed ?? 0,
      lastGame: lastGame ? {
        date: lastGame.date,
        hits: lg.hits ?? 0,
        hr:   lg.homeRuns ?? 0,
        rbi:  lg.rbi ?? 0,
        avg:  parseFloat(lg.avg) || 0,
      } : null,
    };
  } catch {
    return null;
  }
}

export async function fetchMLBNews(): Promise<{ headline: string; link: string }[]> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news",
      { next: { revalidate: 600 } },
    );
    const json = await res.json();
    return (json?.articles ?? []).slice(0, 5).map((a: { headline: string; links?: { web?: { href?: string } } }) => ({
      headline: a.headline,
      link:     a.links?.web?.href ?? "#",
    }));
  } catch {
    return [];
  }
}
