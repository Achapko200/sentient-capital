// app/api/cards/leaderboard/route.ts
import { getLeaderboard } from "@/lib/traders";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  try {
    const traders = await getLeaderboard();
    return Response.json({ traders });
  } catch {
    return Response.json({ traders: [] }, { status: 500 });
  }
}