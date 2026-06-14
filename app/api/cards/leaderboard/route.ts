import { NextResponse }   from "next/server";
import { getLeaderboard, resolveENS } from "@/lib/traders";

export async function GET() {
  const traders = getLeaderboard();

  const resolved = await Promise.all(
    traders.map(async (t) => ({
      ...t,
      ensName: await resolveENS(t.wallet),
    }))
  );

  return NextResponse.json({ traders: resolved });
}