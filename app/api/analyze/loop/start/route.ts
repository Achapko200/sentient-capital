import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getRandomNews } from "@/lib/market";
import { state } from "@/lib/state";

export async function GET() {
  setInterval(async () => {
    const news = getRandomNews();

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
You are AURA Fund AI.

Analyze:
${news}

Return JSON:
{
  "insight": "...",
  "riskScore": number,
  "decision": "BUY | SELL | HOLD"
}
`,
        },
      ],
    });

    let parsed;

    try {
      parsed = JSON.parse(res.choices[0].message.content || "{}");
    } catch {
      parsed = {
        insight: "Market unstable",
        riskScore: 50,
        decision: "HOLD",
      };
    }

    state.lastRun = new Date().toISOString();
    state.news = news;
    state.insight = parsed.insight;
    state.riskScore = parsed.riskScore;
    state.decision = parsed.decision;
  }, 8000);

  return NextResponse.json({
    status: "AURA LOOP STARTED",
  });
}