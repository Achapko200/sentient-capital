// ─── app/api/cards/search/route.ts ───────────────────────────────────────────
import { searchPlayers } from "@/lib/players";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "search");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2)  return Response.json({ players: [] });
  if (q.length > 50) return Response.json({ error: "Query too long" }, { status: 400 });

  if (!/^[\p{L}\s'\-\.]+$/u.test(q)) {
    return Response.json({ players: [] });
  }

  try {
    const players = await searchPlayers(q.trim());
    return Response.json({ players });
  } catch {
    return Response.json({ players: [] }, { status: 500 });
  }
}