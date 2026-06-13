import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getRandomNews } from "@/lib/market";
import { stateStore } from "@/lib/state";

let isRunning = false;

export async function GET() {
  if (isRunning) {
    return NextResponse.json({ status: "ALREADY RUNNING" });
  }

  isRunning = true;

  const loop = async () => {
    const news = getRandomNews();

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
You are AURA Fund AI.

Analyze this market news:
${news}

Return JSON ONLY:
{
  "insight": "string",
  "riskScore": number,
  "decision": "BUY | SELL | HOLD"
}
          `.trim(),
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

    stateStore.update({
      news,
      insight: parsed.insight,
      riskScore: parsed.riskScore,
      decision: parsed.decision,
      lastRun: new Date().toISOString(),
    });

    setTimeout(loop, 8000);
  };

  loop();

  return NextResponse.json({
    status: "AURA LOOP STARTED",
  });
}