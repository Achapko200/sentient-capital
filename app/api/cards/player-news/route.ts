// News about ONE player (Google News RSS), newest first. Cached 30 minutes.
import { getPlayer }      from "@/lib/players";
import { checkRateLimit } from "@/lib/ratelimit";

const SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv)$/i;

function decode(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "");

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const playerId = new URL(req.url).searchParams.get("playerId") ?? "";
  if (!/^\d+$/.test(playerId)) return Response.json({ error: "Invalid playerId" }, { status: 400 });

  const player = await getPlayer(playerId);
  if (!player) return Response.json({ error: "Player not found" }, { status: 404 });

  const parts    = player.name.split(/\s+/).filter(w => !SUFFIX.test(w));
  const lastName = (parts[parts.length - 1] ?? "").toLowerCase();
  const q        = encodeURIComponent(`"${player.name}" baseball`);

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
      return { title, source, url: tag(it, "link"), publishedAt: new Date(tag(it, "pubDate")).toISOString() };
    })
    .filter(a => a.title && a.url && a.title.toLowerCase().includes(lastName))
    .filter(a => { const k = a.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 10);

    return Response.json({ player: player.name, articles }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ player: player.name, articles: [] });
  }
}
