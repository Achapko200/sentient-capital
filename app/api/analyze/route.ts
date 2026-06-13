import { NextResponse } from "next/server";
import { runRiskEngine } from "@/lib/engine";

export async function GET() {
  const portfolio = {
    nvda: 35,
    msft: 25,
    aapl: 20,
    cash: 20,
  };

  const result = runRiskEngine(portfolio);

  return NextResponse.json({
    agent: "risk.aura.eth",
    portfolio,
    ...result,
    timestamp: new Date().toISOString(),
  });
}