"use client";

// ─── Markets.tsx ──────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { getFundState }        from "@/lib/fundstore";
import { StrategyEngine }      from "@/lib/StrategyEngine";
import { MacroAgent }          from "@/lib/agents/Macro";
import { QuantAgent }          from "@/lib/agents/Quant";
import { NewsAgent }           from "@/lib/agents/News";
import { RiskAgent }           from "@/lib/agents/Risk";
import type { AssetState }     from "@/types";

type MarketRow = AssetState & {
  bias:       "BULLISH" | "BEARISH" | "NEUTRAL";
  biasConf:   number;
};

const BIAS_COLORS: Record<string, string> = {
  BULLISH: "text-green-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-yellow-400",
};

export default function Markets() {
  const [rows, setRows] = useState<MarketRow[]>([]);

  useEffect(() => {
    const run = () => {
      const state  = getFundState();
      const assets = Object.values(state.assets);

      const next: MarketRow[] = assets.map((asset) => {
        const macro = MacroAgent.analyze(asset);
        const quant = QuantAgent.analyze(asset);
        const news  = NewsAgent.analyze(asset);
        const risk  = RiskAgent.analyze(asset);

        const { sentiment, confidence } = StrategyEngine.aggregate([
          { ...macro, weight: 0.30 },
          { ...quant, weight: 0.35 },
          { ...news,  weight: 0.20 },
          { ...risk,  weight: 0.15 },
        ]);

        return { ...asset, bias: sentiment, biasConf: confidence };
      });

      setRows(next);
    };

    run();
    const interval = setInterval(run, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">

      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Market Overview</h2>
          <p className="text-sm text-gray-400">Live prices & AI bias signals</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">
          Scanner Active
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const isUp = row.changePct >= 0;
          return (
            <div key={row.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-gray-800 hover:bg-white/8 transition">
              <div className="w-20">
                <p className="text-white font-bold text-sm">{row.symbol}</p>
                <p className="text-gray-500 text-xs">{row.history.length} ticks</p>
              </div>
              <div className="flex-1 px-4">
                <p className="text-gray-400 text-xs">AI sentiment + flow</p>
              </div>
              <div className="text-right mr-6">
                <p className="text-white font-medium text-sm">
                  ${row.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{row.changePct.toFixed(2)}%
                </p>
              </div>
              <div className="text-right w-20">
                <p className={`text-xs font-bold ${BIAS_COLORS[row.bias]}`}>{row.bias}</p>
                <p className="text-gray-600 text-xs">{row.biasConf.toFixed(0)}% conf</p>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-4">Loading market data…</p>
        )}
      </div>
    </div>
  );
}
