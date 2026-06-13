import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function GET() {
  const portfolio = {
    nvda: 35,
    msft: 25,
    aapl: 20,
    cash: 20,
  };

  const prompt = `
You are "risk.aura.eth", a hedge fund risk manager.

Portfolio:
${JSON.stringify(portfolio)}

Return:
{
  "riskScore": number (0-100),
  "exposureWarning": "...",
  "recommendation": "..."
}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.choices[0].message.content || "{}";

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      riskScore: 60,
      exposureWarning: "Default risk state",
      recommendation: "Hold",
    };
  }

  return NextResponse.json({
    agent: "risk.aura.eth",
    portfolio,
    ...parsed,
  });
}