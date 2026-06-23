// ─── app/api/cards/leaderboard/route.ts ──────────────────────────────────────
import { getLeaderboard } from "@/lib/traders";

export async function GET() {
  const traders = await getLeaderboard();
  return Response.json({ traders });
}