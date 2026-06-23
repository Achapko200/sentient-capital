// ─── app/api/cards/search/route.ts ───────────────────────────────────────────
import { searchPlayers } from "@/lib/players";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  // Minimum length check
  if (q.length < 2) {
    return Response.json({ players: [] });
  }

  // Max length — prevent absurdly long queries
  if (q.length > 50) {
    return Response.json({ error: "Query too long" }, { status: 400 });
  }

  // Only allow letters, spaces, hyphens, apostrophes, and periods
  // Covers names like "Acuña Jr.", "De La Cruz", "O'Neill"
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