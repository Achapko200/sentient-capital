// ─── app/api/analyze/route.ts ────────────────────────────────────────────────
// Multi-agent AI analysis chain: Research → Risk → Decision

import { NextResponse }    from "next/server";
import { getRandomNews }   from "@/lib/market";
import { researchStore }   from "@/lib/research";

export async function GET() {
  const news = getRandomNews();

  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  // Without OpenAI key: return rule-based analysis
  if (!OPENAI_KEY) {
    const signal = news.toLowerCase().includes("beat") || news.toLowerCase().includes("surge")
      ? "bullish" : news.toLowerCase().includes("disappoint") || news.toLowerCase().includes("fall")
      ? "bearish" : "neutral";

    const riskScore = signal === "bullish" ? 35 : signal === "bearish" ? 65 : 50;
    const decision  = riskScore > 60 ? "REDUCE EXPOSURE" : riskScore < 40 ? "INCREASE EXPOSURE" : "HOLD";

    researchStore.update({
      symbol:    "MARKET",
      news,
      insight:   `Rule-based: ${signal} signal detected from headline`,
      signal,
      riskScore,
      decision:  decision as "BUY" | "SELL" | "HOLD",
    });

    return NextResponse.json({
      agent:          "aura.fund.orchestrator",
      timestamp:      new Date().toISOString(),
      market_news:    news,
      research_agent: { insight: `${signal} headline detected`, signal },
      risk_agent:     { riskScore, action: decision.toLowerCase() },
      final_decision: decision,
    });
  }

  // ── With OpenAI key: real multi-agent chain ───────────────────────────────
  const callGPT = async (prompt: string) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body:    JSON.stringify({
        model:    "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "{}";
  };

  // Step 1 — Research agent
  let research: { insight: string; signal: string };
  try {
    const raw = await callGPT(`
You are research.aura.eth — a hedge fund research analyst.
Analyze this market news headline: "${news}"
Return ONLY valid JSON (no markdown): {"insight":"...","signal":"bullish|bearish|neutral"}
    `.trim());
    research = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    research = { insight: "Signal parsing failed", signal: "neutral" };
  }

  // Step 2 — Risk agent
  let risk: { riskScore: number; action: string };
  try {
    const raw = await callGPT(`
You are risk.aura.eth — a hedge fund risk manager.
Research signal: ${JSON.stringify(research)}
Return ONLY valid JSON: {"riskScore":number,"action":"increase exposure|reduce exposure|hold"}
    `.trim());
    risk = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    risk = { riskScore: 50, action: "hold" };
  }

  const decision =
    risk.riskScore > 65 ? "REDUCE EXPOSURE" :
    risk.riskScore < 35 ? "INCREASE EXPOSURE" : "HOLD POSITION";

  researchStore.update({
    symbol:    "MARKET",
    news,
    insight:   research.insight,
    signal:    research.signal as "bullish" | "bearish" | "neutral",
    riskScore: risk.riskScore,
    decision:  decision === "INCREASE EXPOSURE" ? "BUY" : decision === "REDUCE EXPOSURE" ? "SELL" : "HOLD",
  });

  return NextResponse.json({
    agent:          "aura.fund.orchestrator",
    timestamp:      new Date().toISOString(),
    market_news:    news,
    research_agent: research,
    risk_agent:     risk,
    final_decision: decision,
  });
}
