// ─── TopBar.tsx ───────────────────────────────────────────────────────────────
"use client";

import { useFund } from "@/context/FundContext";

export default function TopBar() {
  const { equity, pnl, tradeCount } = useFund();
  const isUp = pnl >= 0;

  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-[#050814]">
      <div>
        <h1 className="font-semibold tracking-wide text-white">🧠 AURA Fund OS</h1>
        <p className="text-xs text-slate-500">Autonomous Investment Committee</p>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="text-right">
          <p className="text-gray-400 text-xs">NAV</p>
          <p className="text-white font-mono font-semibold">
            ${(equity / 1_000_000).toFixed(4)}M
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Today P&L</p>
          <p className={`font-mono font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{pnl.toFixed(0)}
          </p>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          LIVE MARKET SYNC
        </span>
        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {tradeCount} TRADES
        </span>
      </div>
    </div>
  );
}
