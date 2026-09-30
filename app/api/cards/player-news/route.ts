// News about ONE player (Google News RSS), last 30 days, major outlets only. Cached 30 minutes.
// A headline counts only if it names the player: full name, or last name + his team.
import { getPlayer }      from "@/lib/players";
import { checkRateLimit } from "@/lib/ratelimit";

const DAYS = 30;

// Only established outlets: national sports media, MLB, wire services, major team-market newspapers
const TRUSTED = [
  "espn", "mlb.com", "mlb trade rumors", "the athletic", "associated press", "ap news", "reuters",
  "yahoo sports", "cbs sports", "nbc sports", "fox sports", "usa today", "sports illustrated", "the score",
  "sportsnet", "tsn", "baseball america", "fangraphs", "baseball prospectus", "bleacher report",
  "new york times", "washington post", "wall street journal", "los angeles times", "new york post",
  "newsday", "daily news", "boston globe", "boston herald", "chicago tribune", "chicago sun-times",
  "philadelphia inquirer", "houston chronicle", "dallas morning news", "san francisco chronicle",
  "seattle times", "tampa bay times", "atlanta journal-constitution", "star tribune", "detroit free press",
  "st. louis post-dispatch", "arizona republic", "baltimore sun", "pittsburgh post-gazette",
  "cincinnati enquirer", "kansas city star", "denver post", "san diego union-tribune", "toronto star",
  "orange county register", "miami herald", "milwaukee journal sentinel", "cleveland.com", "the mercury news",
];
const isTrusted = (source: string) => TRUSTED.some(t => source.toLowerCase().includes(t));
const NOT_NEWS  = /\b(stream|how to watch|live stream|odds|prediction|predictions|picks|props|fantasy)\b/i;
const SUFFIX    = /^(jr\.?|sr\.?|ii|iii|iv)$/i;
const TWO_WORD_NICKNAMES = ["red sox", "white sox", "blue jays"];

// lowercase, strip accents and punctuation: "Rodríguez Jr." -> "rodriguez jr"
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const hasWords = (text: string, words: string) => new RegExp(`(^|\\s)${words.replace(/\s+/g, "\\s+")}(\\s|$)`).test(text);

function decode(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "");

function teamNickname(team: string) {
  const t = norm(team);
  if (!t || t === "retired" || t === "free agent" || t === "unknown") return "";
  const two = TWO_WORD_NICKNAMES.find(n => t.endsWith(n));
  return two ?? t.split(" ").pop() ?? "";
}

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const playerId = new URL(req.url).searchParams.get("playerId") ?? "";
  if (!/^\d+$/.test(playerId)) return Response.json({ error: "Invalid playerId" }, { status: 400 });

  const player = await getPlayer(playerId);
  if (!player) return Response.json({ error: "Player not found" }, { status: 404 });

  const fullName = norm(player.name.split(/\s+/).filter(w => !SUFFIX.test(w)).join(" "));
  const lastName = fullName.split(" ").pop() ?? "";
  const nickname = teamNickname(player.team);
  const q        = encodeURIComponent(`"${player.name}" (MLB OR baseball) when:${DAYS}d`);
  const cutoff   = Date.now() - DAYS * 86_400_000;

  try {
    const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, { next: { revalidate: 1800 } });
    if (!res.ok) return Response.json({ player: player.name, articles: [] });
    const xml   = await res.text();
    const items = xml.split("<item>").slice(1).map(chunk => chunk.split("</item>")[0]);

    const seen = new Set<string>();
    const articles = items.map(it => {
      const rawTitle = tag(it, "title");
      const source   = tag(it, "source");
      const title    = source && rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
      const time     = Date.parse(tag(it, "pubDate"));
      return { title, source, url: tag(it, "link"), time };
    })
    .filter(a => a.title && a.url && Number.isFinite(a.time) && a.time >= cutoff)
    .filter(a => {
      const t = norm(a.title);
      const namesPlayer = hasWords(t, fullName) || (!!nickname && hasWords(t, lastName) && hasWords(t, nickname));
      return namesPlayer && isTrusted(a.source) && !NOT_NEWS.test(a.title);
    })
    .filter(a => { const k = norm(a.title); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => b.time - a.time)
    .slice(0, 10)
    .map(a => ({ title: a.title, source: a.source, url: a.url, publishedAt: new Date(a.time).toISOString() }));

    return Response.json({ player: player.name, articles }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ player: player.name, articles: [] });
  }
}
