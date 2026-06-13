import { NextResponse } from "next/server";
import { getRandomNews } from "@/lib/market";

export async function GET() {
  const news = getRandomNews();

  let insight = "";

  if (news.includes("NVDA")) {
    insight = "Risk rising in AI semiconductor exposure";
  } else if (news.includes("Fed")) {
    insight = "Macro liquidity conditions improving";
  } else {
    insight = "Market neutral, awaiting catalyst";
  }

  return NextResponse.json({
    agent: "research.aura.eth",
    news,
    insight,
  });
}