// app/api/cards/players/route.ts
import { getWatchlist } from "@/lib/players";

export async function GET() {
  const players = await getWatchlist();
  return Response.json(players);
}