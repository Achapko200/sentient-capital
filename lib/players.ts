// ─── lib/players.ts ──────────────────────────────────────────────────────────
// Players come live from the MLB Stats API. The watchlist is everyone who has
// appeared in an MLB game over the last SEASONS_BACK seasons (active + retired).
import type { Player } from "@/lib/cardTypes";

const SEASONS_BACK   = 20;                 // 2006 → today
const WATCHLIST_TTL  = 6 * 60 * 60 * 1000; // rebuild at most every 6 hours per server
const DEFAULT_COLORS = { cardColor: "#1a1a2e", teamColor: "#16213e" };

function headshotUrl(playerId: string): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

const MLB_COLORS: Record<string, { cardColor: string; teamColor: string }> = {
  ARI: { cardColor: "#A71930", teamColor: "#E3D4AD" }, ATL: { cardColor: "#CE1141", teamColor: "#13274F" },
  AZ:  { cardColor: "#A71930", teamColor: "#E3D4AD" }, BAL: { cardColor: "#DF4601", teamColor: "#000000" },
  BOS: { cardColor: "#BD3039", teamColor: "#0D2B56" }, CHC: { cardColor: "#0E3386", teamColor: "#CC3433" },
  CWS: { cardColor: "#27251F", teamColor: "#C4CED4" }, CIN: { cardColor: "#C6011F", teamColor: "#000000" },
  CLE: { cardColor: "#00385D", teamColor: "#E31937" }, COL: { cardColor: "#33006F", teamColor: "#C4CED4" },
  DET: { cardColor: "#0C2340", teamColor: "#FA4616" }, HOU: { cardColor: "#002D62", teamColor: "#EB6E1F" },
  KC:  { cardColor: "#004687", teamColor: "#C09A5B" }, LAA: { cardColor: "#BA0021", teamColor: "#003263" },
  LAD: { cardColor: "#005A9C", teamColor: "#EF3E42" }, MIA: { cardColor: "#00A3E0", teamColor: "#EF3340" },
  MIL: { cardColor: "#12284B", teamColor: "#FFC52F" }, MIN: { cardColor: "#002B5C", teamColor: "#D31145" },
  NYM: { cardColor: "#002D72", teamColor: "#FF5910" }, NYY: { cardColor: "#003087", teamColor: "#C4CED4" },
  OAK: { cardColor: "#003831", teamColor: "#EFB21E" }, ATH: { cardColor: "#003831", teamColor: "#EFB21E" },
  PHI: { cardColor: "#E81828", teamColor: "#002D72" }, PIT: { cardColor: "#FDB827", teamColor: "#27251F" },
  SD:  { cardColor: "#2F241D", teamColor: "#FFC425" }, SF:  { cardColor: "#FD5A1E", teamColor: "#27251F" },
  SEA: { cardColor: "#0C2C56", teamColor: "#005C5C" }, STL: { cardColor: "#C41E3A", teamColor: "#0C2340" },
  TB:  { cardColor: "#092C5C", teamColor: "#8FBCE6" }, TEX: { cardColor: "#003278", teamColor: "#C0111F" },
  TOR: { cardColor: "#134A8E", teamColor: "#1D2D5C" }, WSH: { cardColor: "#AB0003", teamColor: "#14225A" },
};
const deriveColors = (abbrev: string) => MLB_COLORS[abbrev] ?? DEFAULT_COLORS;

// Card name from MLB data (debut year + the most-graded set for that era)
function buildCardName(p: any): string {
  const name      = p.fullName ?? p.name ?? "Player";
  const debutYear = p.mlbDebutDate ? new Date(p.mlbDebutDate).getFullYear() : new Date().getFullYear();
  const set = debutYear >= 2015 ? "Topps Chrome Rookie PSA 10"
            : debutYear >= 2010 ? "Topps Chrome PSA 10"
            :                     "Topps PSA 10";
  return `${name} ${debutYear} ${set}`;
}

function toPlayer(p: any, team?: { name: string; abbr: string }): Player {
  const colors = deriveColors(team?.abbr ?? "");
  return {
    id:        String(p.id),
    name:      p.fullName,
    team:      team?.name ?? (p.active === false ? "Retired" : "Free agent"),
    position:  p.primaryPosition?.abbreviation ?? "—",
    cardName:  buildCardName(p),
    image:     "⚾",
    cardImage: headshotUrl(String(p.id)),
    ...colors,
  };
}

// ── One player (search results, card pages) ─────────────────────────────────
async function fetchMLBPlayer(playerId: string): Promise<Player | null> {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=currentTeam`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const p = (await res.json()).people?.[0];
    if (!p) return null;
    const team = p.currentTeam?.name ? { name: p.currentTeam.name, abbr: p.currentTeam.abbreviation ?? "" } : undefined;
    return toPlayer(p, team);
  } catch {
    return null;
  }
}

// ── Everyone who played in the last SEASONS_BACK seasons ────────────────────
async function fetchTeams(): Promise<Map<number, { name: string; abbr: string }>> {
  const map = new Map<number, { name: string; abbr: string }>();
  try {
    const res  = await fetch("https://statsapi.mlb.com/api/v1/teams?sportId=1&fields=teams,id,name,abbreviation", { next: { revalidate: 86400 } });
    for (const t of (await res.json()).teams ?? []) map.set(t.id, { name: t.name, abbr: t.abbreviation });
  } catch {}
  return map;
}

async function fetchSeason(season: number): Promise<any[]> {
  try {
    const fields = "people,id,fullName,mlbDebutDate,active,primaryPosition,abbreviation,currentTeam";
    const res = await fetch(`https://statsapi.mlb.com/api/v1/sports/1/players?season=${season}&fields=${fields}`,
      { next: { revalidate: season === new Date().getFullYear() ? 86400 : 604800 } });
    if (!res.ok) return [];
    return (await res.json()).people ?? [];
  } catch {
    return [];
  }
}

let watchlistCache: { at: number; players: Player[] } | null = null;

async function buildWatchlist(): Promise<Player[]> {
  const now     = new Date().getFullYear();
  const seasons = Array.from({ length: SEASONS_BACK + 1 }, (_, i) => now - i);  // newest first
  const [teams, ...perSeason] = await Promise.all([fetchTeams(), ...seasons.map(fetchSeason)]);
  const seen = new Set<string>();
  const out: Player[] = [];
  for (const people of perSeason) {
    for (const p of people) {
      const id = String(p.id);
      if (!p.fullName || seen.has(id)) continue;
      seen.add(id);
      out.push(toPlayer(p, p.currentTeam?.id ? teams.get(p.currentTeam.id) : undefined));
    }
  }
  return out;
}

export async function getWatchlist(): Promise<Player[]> {
  if (watchlistCache && Date.now() - watchlistCache.at < WATCHLIST_TTL) return watchlistCache.players;
  const players = await buildWatchlist();
  if (players.length) watchlistCache = { at: Date.now(), players };
  return players;
}

export async function getPlayer(id: string): Promise<Player | null> {
  return fetchMLBPlayer(id);
}

// Any MLB player ever (active or retired)
export async function searchPlayers(query: string): Promise<Player[]> {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&sportId=1`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data    = await res.json();
    const results = await Promise.all((data.people ?? []).slice(0, 10).map((p: any) => fetchMLBPlayer(String(p.id))));
    return results.filter(Boolean) as Player[];
  } catch {
    return [];
  }
}
