// ─── components/cards/Portfolio.tsx ──────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";
import { useDynamicContext }   from "@dynamic-labs/sdk-react-core";

type Position = {
  cardId:        string;
  playerName:    string;
  cardName:      string;
  shares:        number;
  avgCost:       number;
  currentPrice:  number;
  unrealizedPnl: number;
  pnlPct:        number;
  cardImage:     string;
};

export default function Portfolio() {
  const { primaryWallet, user } = useDynamicContext();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!primaryWallet?.address) { setLoading(false); return; }
    fetch(`/api/cards/portfolio?wallet=${primaryWallet.address}`)
      .then(r => r.json())
      .then(d => setPositions(d.positions ?? []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, [primaryWallet?.address]);

  const totalValue   = positions.reduce((s, p) => s + p.currentPrice * p.shares, 0);
  const totalCost    = positions.reduce((s, p) => s + p.avgCost * p.shares, 0);
  const totalPnl     = totalValue - totalCost;
  const totalPnlPct  = totalCost > 0 ? Math.round((totalPnl / totalCost) * 1000) / 10 : 0;

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <p className="text-4xl mb-3">💼</p>
        <p className="text-gray-700 font-bold">Connect your wallet to see your portfolio</p>
        <p className="text-gray-400 text-sm mt-1">Your card positions and P&L will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Summary bar */}
      <div className="bg-gray-950 rounded-2xl p-5 text-white grid grid-cols-3 gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Portfolio Value</p>
          <p className="text-2xl font-black mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Total Cost</p>
          <p className="text-2xl font-black mt-1">${totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Unrealized P&L</p>
          <p className={`text-2xl font-black mt-1 ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            <span className="text-sm ml-1">({totalPnlPct}%)</span>
          </p>
        </div>
      </div>

      {/* Positions */}
      {positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No positions yet — go to the Trade tab to buy card shares</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-gray-900 font-black">Open Positions</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {positions.map((pos) => (
              <div key={pos.cardId} className="flex items-center gap-4 px-5 py-4">
                <img src={pos.cardImage} alt={pos.playerName}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-sm">{pos.playerName}</p>
                  <p className="text-gray-400 text-xs">{pos.shares} shares · avg ${pos.avgCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-black">${(pos.currentPrice * pos.shares).toFixed(2)}</p>
                  <p className={`text-xs font-bold ${pos.unrealizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)} ({pos.pnlPct}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}