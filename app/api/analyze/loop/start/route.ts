// ─── app/api/analyze/loop/start/route.ts ────────────────────────────────────

import { NextResponse }  from "next/server";
import { researchStore } from "../../../../lib/research";
import { getRandomNews } from "../../../../lib/market";

let isRunning = false;

export async function GET() {
  if (isRunning) {
    return NextResponse.json({ status: "ALREADY_RUNNING", state: researchStore.get() });
  }

  isRunning = true;

  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  const runLoop = async () => {
    const news = getRandomNews();

    if (!OPENAI_KEY) {
      // Rule-based fallback
      const signal = news.toLowerCase().includes("beat") ? "bullish"
        : news.toLowerCase().includes("fall") ? "bearish" : "neutral";

      researchStore.update({
        symbol:    "LOOP",
        news,
        insight:   `Autonomous rule-based: ${signal} signal`,
        signal,
        riskScore: signal === "bullish" ? 30 : signal === "bearish" ? 70 : 50,
        decision:  signal === "bullish" ? "BUY" : signal === "bearish" ? "SELL" : "HOLD",
      });
      setTimeout(runLoop, 8000);
      return;
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body:    JSON.stringify({
          model:    "gpt-4o-mini",
          messages: [{
            role:    "user",
            content: `You are AURA Fund AI. Analyze: "${news}". Return ONLY JSON: {"insight":"...","riskScore":number,"decision":"BUY|SELL|HOLD"}`,
          }],
        }),
      });
      const data  = await res.json();
      const text  = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

      researchStore.update({
        symbol:    "LOOP",
        news,
        insight:   parsed.insight ?? "",
        signal:    parsed.decision === "BUY" ? "bullish" : parsed.decision === "SELL" ? "bearish" : "neutral",
        riskScore: parsed.riskScore ?? 50,
        decision:  parsed.decision ?? "HOLD",
      });
    } catch {
      researchStore.update({ news, insight: "Loop parse error", decision: "HOLD" });
    }

    setTimeout(runLoop, 8000);
  };

  runLoop();

  return NextResponse.json({ status: "LOOP_STARTED" });
}
