"use client";

// ─── PortfolioCard.tsx ────────────────────────────────────────────────────────

import { useFund } from "@/context/FundContext";

export default function PortfolioCard() {
  const { equity, pnl, drawdown, sharpe, positions, cash } = useFund();

  const STARTING = 1_000_000;
  const totalPct = ((equity - STARTING) / STARTING) * 100;
  const isUp     = pnl >= 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const positionList = Object.values(positions);
  const deployed     = positionList.reduce((s, p) => s + p.size, 0);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">

      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Portfolio</h2>
          <p className="text-sm text-gray-400">Live risk metrics</p>
        </div>
        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
          LIVE P&L
        </span>
      </div>

      {/* Equity + P&L */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">Equity</p>
          <p className="text-white text-xl font-bold">{fmt(equity)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">P&L</p>
          <p className={`text-xl font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{fmt(pnl)}
          </p>
          <p className={`text-xs ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{totalPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Risk stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">Drawdown</p>
          <p className="text-red-400 font-semibold">-{drawdown.toFixed(2)}%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">Sharpe</p>
          <p className={`font-semibold ${sharpe >= 1 ? "text-green-400" : sharpe >= 0 ? "text-yellow-400" : "text-red-400"}`}>
            {sharpe.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Exposure bars */}
      <div className="space-y-3 mb-5">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Market exposure</span>
            <span>{Math.min(100, deployed).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, deployed)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Cash buffer</span>
            <span>{Math.max(0, 100 - deployed).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(0, 100 - deployed)}%` }} />
          </div>
        </div>
      </div>

      {/* Positions */}
      <div>
        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Open Positions</p>
        {positionList.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">No open positions yet</p>
        ) : (
          <div className="space-y-2">
            {positionList.map((pos) => {
              const pnlColor = pos.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400";
              return (
                <div key={pos.symbol}
                  className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{pos.symbol}</p>
                    <p className="text-gray-500 text-xs">entry ${pos.entryPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300 text-sm">{pos.size.toFixed(1)}%</p>
                    <p className={`text-xs ${pnlColor}`}>
                      {pos.unrealizedPnL >= 0 ? "+" : ""}
                      {pos.unrealizedPnL.toFixed(0)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
