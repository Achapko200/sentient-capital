"use client";

// ─── InsightsPanel.tsx ────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { getFundState }        from "@/lib/fundstore";
import { NewsAgent }           from "@/lib/agents/News";
import { MacroAgent }          from "@/lib/agents/Macro";
import type { AgentVote }      from "@/types";

type Insight = {
  id:         number;
  source:     string;
  headline:   string;
  signal:     AgentVote["sentiment"];
  confidence: number;
  summary:    string;
  time:       string;
};

const SIGNAL_COLORS: Record<string, string> = {
  BULLISH: "text-green-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-yellow-400",
};

export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const generate = () => {
      const state  = getFundState();
      const assets = Object.values(state.assets).slice(0, 4);
      if (assets.length === 0) return;

      const next: Insight[] = assets.map((asset, i) => {
        const news  = NewsAgent.analyze(asset) as AgentVote & { headline: string };
        const macro = MacroAgent.analyze(asset);

        return {
          id:         Date.now() + i,
          source:     i % 2 === 0 ? "News Engine" : "Macro Agent",
          headline:   news.headline,
          signal:     i % 2 === 0 ? news.sentiment : macro.sentiment,
          confidence: i % 2 === 0 ? news.confidence : macro.confidence,
          summary:    i % 2 === 0 ? news.reason.replace("News: ", "") : macro.reason.replace("Macro: ", ""),
          time:       new Date().toLocaleTimeString(),
        };
      });

      setInsights(next);
    };

    generate();
    const interval = setInterval(generate, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">

      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">AI Market Insights</h2>
          <p className="text-sm text-gray-400">Real-time signals from agent swarm</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
          Live Intelligence
        </div>
      </div>

      <div className="space-y-3">
        {insights.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-4">Generating insights…</p>
        )}
        {insights.map((ins) => (
          <div key={ins.id}
            className="p-4 rounded-lg bg-white/5 border border-gray-800 hover:bg-white/8 transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-gray-500 text-xs">{ins.source}</p>
                <p className="text-white text-sm font-medium mt-0.5">{ins.headline}</p>
              </div>
              <span className={`text-xs font-bold ml-4 shrink-0 ${SIGNAL_COLORS[ins.signal]}`}>
                {ins.signal}
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">{ins.summary}</p>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Confidence: {ins.confidence.toFixed(0)}%</span>
              <span>{ins.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
