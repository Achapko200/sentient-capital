import { NextResponse }    from "next/server";
import { getLeaderboard } from "@/lib/traders";

export async function GET() {
  return NextResponse.json({ traders: getLeaderboard() });
}