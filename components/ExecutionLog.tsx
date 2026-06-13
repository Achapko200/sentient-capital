"use client";

// ─── ExecutionLog.tsx ─────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { DecisionEngine }      from "@/lib/DecisionEngine";
import { useFund }             from "@/context/FundContext";
import { updateAssetPrice }    from "@/lib/fundstore";
import type { TradeSignal }    from "@/types";

const ACTION_COLORS: Record<string, string> = {
  BUY:   "text-green-400",
  SELL:  "text-red-400",
  HEDGE: "text-yellow-400",
  HOLD:  "text-gray-500",
};

const ACTION_BG: Record<string, string> = {
  BUY:   "bg-green-500/10 border-green-500/20",
  SELL:  "bg-red-500/10 border-red-500/20",
  HEDGE: "bg-yellow-500/10 border-yellow-500/20",
  HOLD:  "bg-gray-500/10 border-gray-500/20",
};

export default function ExecutionLog() {
  const [trades, setTrades]   = useState<TradeSignal[]>([]);
  const { addTrade, markToMarket, updateMarket } = useFund();

  useEffect(() => {
    const engine = new DecisionEngine();

    engine.start(
      (trade) => {
        // Update fundstore so future ticks have the latest price
        updateAssetPrice(trade.symbol, trade.price);

        // Update market in FundContext for mark-to-market
        updateMarket({ symbol: trade.symbol, price: trade.price, changePct: 0 });

        // Update global fund state
        addTrade(trade);

        // Add to local UI feed
        setTrades((prev) => [trade, ...prev].slice(0, 30));
      },
      markToMarket, // called every tick for equity curve
    );

    return () => engine.stop();
  }, [addTrade, markToMarket, updateMarket]);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">

      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Execution Engine</h2>
          <p className="text-sm text-gray-400">Live AI-generated trades</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          FUND CONNECTED
        </div>
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {trades.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">
            Waiting for strategy signals…
          </p>
        )}

        {trades.map((trade) => (
          <div
            key={trade.id}
            className={`p-4 rounded-lg border ${ACTION_BG[trade.action] ?? "bg-white/5 border-gray-800"} transition-all`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${ACTION_COLORS[trade.action]}`}>
                    {trade.action}
                  </span>
                  <span className="text-white font-semibold">{trade.symbol}</span>
                  <span className="text-gray-500 text-xs">@ ${trade.price.toLocaleString()}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed truncate">
                  {trade.reason}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-white text-sm font-medium">{trade.size.toFixed(1)}%</p>
                <p className="text-gray-500 text-xs">conf {trade.confidence}%</p>
              </div>
            </div>

            <p className="text-gray-600 text-xs mt-2">{trade.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
