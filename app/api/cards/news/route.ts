// ─── app/api/cards/news/route.ts ─────────────────────────────────────────────
import { NextResponse }   from "next/server";
import { fetchMLBNews }   from "@/lib/mlb";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  try {
    const news = await fetchMLBNews();
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: [] }, { status: 500 });
  }
}