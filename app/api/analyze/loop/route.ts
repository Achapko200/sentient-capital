import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getRandomNews } from "@/lib/market";

export async function GET() {
  const news = getRandomNews();

  // STEP 1 — Research Agent
  const researchPrompt = `
You are research.aura.eth.

Analyze this news:
${news}

Return JSON:
{
  "insight": "...",
  "signal": "bullish | bearish | neutral"
}
`;

  const researchRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: researchPrompt }],
  });

  let research;
  try {
    research = JSON.parse(researchRes.choices[0].message.content || "{}");
  } catch {
    research = { insight: "unstable signal", signal: "neutral" };
  }

  // STEP 2 — Risk Agent
  const riskPrompt = `
You are risk.aura.eth.

Based on this research signal:
${JSON.stringify(research)}

Return JSON:
{
  "riskScore": number (0-100),
  "action": "increase exposure | reduce exposure | hold"
}
`;

  const riskRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: riskPrompt }],
  });

  let risk;
  try {
    risk = JSON.parse(riskRes.choices[0].message.content || "{}");
  } catch {
    risk = { riskScore: 50, action: "hold" };
  }

  // STEP 3 — Final Decision Engine
  const finalDecision =
    risk.riskScore > 70
      ? "REDUCE EXPOSURE"
      : risk.riskScore < 30
      ? "INCREASE EXPOSURE"
      : "HOLD POSITION";

  return NextResponse.json({
    agent: "aura.fund.orchestrator",
    timestamp: new Date().toISOString(),

    market_news: news,

    research_agent: research,
    risk_agent: risk,

    final_decision: finalDecision,
  });
}