"use client";
import { useEffect, useState } from "react";
import { getFundState } from "@/lib/fundstore";
import type { AssetState } from "@/types";

type AssetStateWithChangePct = AssetState & { changePct?: number };
type MarketRow = AssetStateWithChangePct & { bias: "BULLISH" | "BEARISH" | "NEUTRAL"; biasConf: number };

const BIAS_COLORS: Record<string, string> = {
  BULLISH: "text-green-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-yellow-400",
};

export default function Markets() {
  const [rows, setRows] = useState<MarketRow[]>([]);

  useEffect(() => {
    const run = () => {
      const assets = Object.values(getFundState().assets) as AssetStateWithChangePct[];
      setRows(assets.map((a) => {
        const changePct = a.changePct ?? 0;
        return {
          ...a,
          changePct,
          bias: changePct > 0.5 ? "BULLISH" : changePct < -0.5 ? "BEARISH" : "NEUTRAL",
          biasConf: 60 + Math.abs(changePct) * 5,
        };
      }));
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
          <p className="text-sm text-gray-400">Live prices and AI bias signals</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">
          Scanner Active
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.symbol} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-gray-800">
            <span className="text-white font-bold w-14">{row.symbol}</span>
            <div className="text-right mr-6">
              <p className="text-white text-sm">
                ${(row.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className={(row.changePct ?? 0) >= 0 ? "text-xs text-green-400" : "text-xs text-red-400"}>
                {(row.changePct ?? 0) >= 0 ? "+" : ""}{(row.changePct ?? 0).toFixed(2)}%
              </p>
            </div>
            <div className="text-right w-20">
              <p className={"text-xs font-bold " + (BIAS_COLORS[row.bias] ?? "")}>{row.bias}</p>
              <p className="text-gray-600 text-xs">{row.biasConf.toFixed(0)}% conf</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-4">Loading...</p>
        )}
      </div>
    </div>
  );
}