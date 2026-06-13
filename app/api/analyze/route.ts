import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { portfolio } = await req.json();

  const nvda = portfolio.NVDA || 0;

  // simple “AI-like” logic for now (we replace with OpenAI later)
  const risk =
    nvda > 40 ? "HIGH" :
    nvda > 30 ? "MODERATE" :
    "LOW";

  const trades =
    nvda > 35
      ? ["Reduce NVDA by 10%", "Increase MSFT by 5%"]
      : ["Maintain positions", "Monitor volatility"];

  return NextResponse.json({
    thesis: "AI detected shifting semiconductor risk exposure.",
    risk,
    trades,
    timestamp: Date.now(),
  });
}