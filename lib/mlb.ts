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
    // Season stats
    const seasonRes = await fetch(
      `${BASE}/people/${playerId}/stats?stats=season&season=2025&group=hitting`,
      { next: { revalidate: 300 } }, // cache 5 min
    );
    const seasonJson = await seasonRes.json();
    const season: RawSeason = seasonJson?.stats?.[0]?.splits?.[0];

    // Last 5 game log
    const logRes = await fetch(
      `${BASE}/people/${playerId}/stats?stats=gameLog&season=2025&group=hitting`,
      { next: { revalidate: 300 } },
    );
    const logJson = await logRes.json();
    const gameLogs: RawGameLog[] = logJson?.stats?.[0]?.splits ?? [];
    const lastGame = gameLogs[0] ?? null;

    if (!season) return null;

    const s = season.stat;
    const lg = lastGame?.stat;

    return {
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
