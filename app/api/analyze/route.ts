import { NextResponse } from "next/server";
import {
  runResearchAgent,
  runRiskAgent,
  runTraderAgent,
} from "@/lib/engine";

export async function POST(req: Request) {
  const { portfolio, mode } = await req.json();

  const research = runResearchAgent(portfolio);
  const risk = runRiskAgent(portfolio);
  const trader = runTraderAgent(portfolio, risk);

  return NextResponse.json({
    mode,
    agents: {
      research,
      risk,
      trader,
    },
    finalPortfolio: trader.portfolio,
    summary: `${research.reasoning}. ${risk.reasoning}. ${trader.reasoning}`,
  });
}