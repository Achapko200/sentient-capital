// ─── app/api/analyze/risk/route.ts ───────────────────────────────────────────

import { NextResponse }   from "next/server";
import { scorePortfolio } from "@/lib/risk";
import { getFundState }   from "@/lib/fundstore";

export async function GET() {
  const state   = getFundState();
  const assets  = Object.values(state.assets);

  // Build a simple portfolio snapshot from current asset prices
  // (equal-weight for now; real implementation reads from FundContext positions)
  const snapshot: Record<string, number> = {};
  const perAsset = assets.length > 0 ? Math.floor(80 / assets.length) : 0;
  for (const a of assets) snapshot[a.symbol] = perAsset;

  const report = scorePortfolio(snapshot);

  return NextResponse.json({
    agent:     "risk.aura.eth",
    timestamp: new Date().toISOString(),
    portfolio: snapshot,
    ...report,
  });
}
