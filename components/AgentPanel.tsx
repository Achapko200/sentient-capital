"use client";

// ─── AgentPanel.tsx ───────────────────────────────────────────────────────────
// Shows the three AI agents with their live sentiment, confidence, and reasoning.

import { useEffect, useState } from "react";
import { getFundState }        from "@/lib/fundstore";
import { MacroAgent }          from "@/lib/agents/Macro";
import { QuantAgent }          from "@/lib/agents/Quant";
import { NewsAgent }           from "@/lib/agents/News";
import { RiskAgent }           from "@/lib/agents/Risk";
import type { AgentVote }      from "@/types";

type AgentState = {
  name:       string;
  role:       string;
  ens:        string;
  vote:       AgentVote | null;
  headline?:  string;
};

const SENTIMENT_COLOR: Record<string, string> = {
  BULLISH: "text-green-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-yellow-400",
};

const SENTIMENT_BG: Record<string, string> = {
  BULLISH: "bg-green-500/10 border-green-500/20",
  BEARISH: "bg-red-500/10 border-red-500/20",
  NEUTRAL: "bg-yellow-500/10 border-yellow-500/20",
};

export default function AgentPanel() {
  const [agents, setAgents] = useState<AgentState[]>([
    { name: "Alpha",    role: "Research Analyst",   ens: "research.aura.eth",  vote: null },
    { name: "Guardian", role: "Quantitative Model",  ens: "quant.aura.eth",     vote: null },
    { name: "Sentinel", role: "Risk Manager",         ens: "risk.aura.eth",      vote: null },
  ]);

  useEffect(() => {
    const run = () => {
      const state  = getFundState();
      const assets = Object.values(state.assets);
      if (assets.length === 0) return;

      // Use first asset as representative for the panel
      const asset = assets[0];

      const macro = MacroAgent.analyze(asset);
      const quant = QuantAgent.analyze(asset);
      const risk  = RiskAgent.analyze(asset);
      const news  = NewsAgent.analyze(asset) as AgentVote & { headline?: string };

      setAgents([
        { name: "Alpha",    role: "Research Analyst",   ens: "research.aura.eth", vote: news,  headline: news.headline },
        { name: "Guardian", role: "Quantitative Model",  ens: "quant.aura.eth",    vote: quant },
        { name: "Sentinel", role: "Risk Manager",         ens: "risk.aura.eth",     vote: risk  },
      ]);
    };

    run();
    const interval = setInterval(run, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {agents.map((agent) => {
        const sentiment = agent.vote?.sentiment ?? "NEUTRAL";
        return (
          <div
            key={agent.name}
            className={`rounded-xl border p-5 transition-all duration-500 ${SENTIMENT_BG[sentiment] ?? "bg-white/5 border-gray-800"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-bold">{agent.name}</h3>
                <p className="text-gray-400 text-xs">{agent.role}</p>
                <p className="text-gray-600 text-xs font-mono mt-0.5">{agent.ens}</p>
              </div>
              {agent.vote && (
                <span className={`text-xs font-bold px-2 py-1 rounded ${SENTIMENT_COLOR[sentiment]}`}>
                  {sentiment}
                </span>
              )}
            </div>

            {agent.vote ? (
              <>
                {/* Confidence bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Confidence</span>
                    <span>{agent.vote.confidence.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        sentiment === "BULLISH" ? "bg-green-500" :
                        sentiment === "BEARISH" ? "bg-red-500" : "bg-yellow-500"
                      }`}
                      style={{ width: `${agent.vote.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Reason */}
                <p className="text-gray-400 text-xs leading-relaxed">
                  {agent.vote.reason}
                </p>
              </>
            ) : (
              <p className="text-gray-600 text-sm">Initializing…</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
