// ─── app/api/cards/players/route.ts ──────────────────────────────────────────
import { getWatchlist }   from "@/lib/players";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  try {
    const players = await getWatchlist();
    if (!Array.isArray(players) || players.length === 0) {
      return Response.json([], { status: 200 });
    }
    return Response.json(players);
  } catch {
    return Response.json([], { status: 500 });
  }
}