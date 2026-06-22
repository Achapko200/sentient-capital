// ─── app/api/cards/search/route.ts ───────────────────────────────────────────
import { searchPlayers } from "@/lib/players";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (q.length < 2) return Response.json({ players: [] });
  const players = await searchPlayers(q);
  return Response.json({ players });
}