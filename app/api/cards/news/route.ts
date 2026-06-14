// ─── app/api/cards/news/route.ts ─────────────────────────────────────────────

import { NextResponse }  from "next/server";
import { fetchMLBNews }  from "@/lib/mlb";

export async function GET() {
  const news = await fetchMLBNews();
  return NextResponse.json({ news });
}
