// ─── lib/players.ts ──────────────────────────────────────────────────────────

import type { Player } from "@/lib/cardTypes";

const DEFAULT_COLORS = { cardColor: "#1a1a2e", teamColor: "#16213e" };

function headshotUrl(playerId: string): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function deriveColors(abbrev: string): { cardColor: string; teamColor: string } {
  const MLB_COLORS: Record<string, { cardColor: string; teamColor: string }> = {
    ARI: { cardColor: "#A71930", teamColor: "#E3D4AD" },
    ATL: { cardColor: "#CE1141", teamColor: "#13274F" },
    BAL: { cardColor: "#DF4601", teamColor: "#000000" },
    BOS: { cardColor: "#BD3039", teamColor: "#0D2B56" },
    CHC: { cardColor: "#0E3386", teamColor: "#CC3433" },
    CWS: { cardColor: "#27251F", teamColor: "#C4CED4" },
    CIN: { cardColor: "#C6011F", teamColor: "#000000" },
    CLE: { cardColor: "#00385D", teamColor: "#E31937" },
    COL: { cardColor: "#33006F", teamColor: "#C4CED4" },
    DET: { cardColor: "#0C2340", teamColor: "#FA4616" },
    HOU: { cardColor: "#002D62", teamColor: "#EB6E1F" },
    KC:  { cardColor: "#004687", teamColor: "#C09A5B" },
    LAA: { cardColor: "#BA0021", teamColor: "#003263" },
    LAD: { cardColor: "#005A9C", teamColor: "#EF3E42" },
    MIA: { cardColor: "#00A3E0", teamColor: "#EF3340" },
    MIL: { cardColor: "#12284B", teamColor: "#FFC52F" },
    MIN: { cardColor: "#002B5C", teamColor: "#D31145" },
    NYM: { cardColor: "#002D72", teamColor: "#FF5910" },
    NYY: { cardColor: "#003087", teamColor: "#C4CED4" },
    OAK: { cardColor: "#003831", teamColor: "#EFB21E" },
    PHI: { cardColor: "#E81828", teamColor: "#002D72" },
    PIT: { cardColor: "#FDB827", teamColor: "#27251F" },
    SD:  { cardColor: "#2F241D", teamColor: "#FFC425" },
    SF:  { cardColor: "#FD5A1E", teamColor: "#27251F" },
    SEA: { cardColor: "#0C2C56", teamColor: "#005C5C" },
    STL: { cardColor: "#C41E3A", teamColor: "#0C2340" },
    TB:  { cardColor: "#092C5C", teamColor: "#8FBCE6" },
    TEX: { cardColor: "#003278", teamColor: "#C0111F" },
    TOR: { cardColor: "#134A8E", teamColor: "#1D2D5C" },
    WSH: { cardColor: "#AB0003", teamColor: "#14225A" },
  };
  return MLB_COLORS[abbrev] ?? DEFAULT_COLORS;
}

const KNOWN_CARDS: Record<string, string> = {
  "656941": "Kyle Schwarber 2015 Topps Chrome Rookie PSA 10",
  "670541": "Yordan Alvarez 2019 Topps Chrome Rookie PSA 10",
  "700250": "Ben Rice 2024 Topps Chrome Rookie PSA 10",
  "683002": "Paul Skenes 2024 Topps Chrome Rookie PSA 10",
  "671939": "Gunnar Henderson 2022 Topps Chrome Rookie PSA 10",
  "660670": "Ronald Acuna 2019 Topps Chrome Rookie PSA 10",
  "808967": "Wyatt Langford 2024 Topps Chrome Rookie PSA 10",
  "694973": "Julio Rodriguez 2020 Topps Chrome Rookie PSA 10",
  "691406": "Junior Caminero 2023 Topps Chrome Rookie PSA 10",
  "682998": "Jackson Holliday 2024 Topps Chrome Rookie PSA 10",
};

function buildCardName(p: any): string {
  if (KNOWN_CARDS[String(p.id)]) return KNOWN_CARDS[String(p.id)];
  const year = p.mlbDebutDate
    ? new Date(p.mlbDebutDate).getFullYear()
    : new Date().getFullYear();
  const set  = year >= 2023 ? "Topps Chrome Rookie PSA 10"
             : year >= 2020 ? "Topps Chrome PSA 10"
             :                "Topps Update Rookie PSA 10";
  return `${year} ${set}`;
}

async function fetchMLBPlayer(playerId: string): Promise<Player | null> {
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=currentTeam`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p    = data.people?.[0];
    if (!p) return null;

    const abbrev = p.currentTeam?.abbreviation ?? "";
    const colors = deriveColors(abbrev);

    return {
      id:        String(p.id),
      name:      p.fullName,
      team:      p.currentTeam?.name ?? "Unknown",
      position:  p.primaryPosition?.abbreviation ?? "—",
      cardName:  buildCardName(p),
      image:     "⚾",
      cardImage: headshotUrl(String(p.id)),
      ...colors,
    };
  } catch {
    return null;
  }
}

// ─── Try multiple stat categories until one returns players ───────────────────
const LEADER_CATEGORIES = [
  "homeRuns",
  "battingAverage",
  "onBasePlusSlugging",
  "rbi",
  "hits",
];

async function fetchLeadersByCategory(category: string): Promise<Player[]> {
  const currentYear = new Date().getFullYear();

  // Try current year first, then previous year
  for (const season of [currentYear, currentYear - 1]) {
    try {
      const res = await fetch(
        `https://statsapi.mlb.com/api/v1/stats/leaders?` +
        `leaderCategories=${category}&season=${season}&sportId=1&limit=10`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) continue;

      const data    = await res.json();
      const leaders = data.leagueLeaders?.[0]?.leaders ?? [];
      if (leaders.length === 0) continue;

      const players = await Promise.all(
        leaders.map((l: any) => fetchMLBPlayer(String(l.person.id)))
      );
      const valid = players.filter(Boolean) as Player[];
      if (valid.length > 0) return valid;
    } catch {
      continue;
    }
  }

  return [];
}

async function fetchTopPlayers(): Promise<Player[]> {
  // Try each stat category in order until we get players
  for (const category of LEADER_CATEGORIES) {
    const players = await fetchLeadersByCategory(category);
    if (players.length > 0) return players;
  }

  // If all categories fail return empty — the UI shows the "no players" message
  return [];
}

export async function getWatchlist(): Promise<Player[]> {
  return fetchTopPlayers();
}

export async function getPlayer(id: string): Promise<Player | null> {
  return fetchMLBPlayer(id);
}

export async function searchPlayers(query: string): Promise<Player[]> {
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&sportId=1`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data    = await res.json();
    const results = await Promise.all(
      (data.people ?? []).slice(0, 10).map((p: any) => fetchMLBPlayer(String(p.id)))
    );
    return results.filter(Boolean) as Player[];
  } catch {
    return [];
  }
}