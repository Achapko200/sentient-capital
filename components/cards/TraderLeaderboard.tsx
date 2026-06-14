"use client";

import { useEffect, useState } from "react";
import type { Trader } from "@/lib/traders";

export default function TraderLeaderboard() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("/api/cards/leaderboard");
        const json = await res.json();
        setTraders(json.traders ?? []);
      } catch {
        setTraders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-gray-900 font-black text-base">Trader Leaderboard</h3>
          <p className="text-gray-400 text-xs mt-0.5">Unrealized gains · ranked by profit</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
          LIVE P&L
        </span>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {traders.map((trader, idx) => (
            <div key={trader.id}>
              <button
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                onClick={() => setExpanded(expanded === trader.id ? null : trader.id)}
              >
                {/* Rank */}
                <span className={`text-lg font-black w-6 shrink-0 ${
                  idx === 0 ? "text-yellow-500" :
                  idx === 1 ? "text-gray-400" :
                  idx === 2 ? "text-orange-500" : "text-gray-300"
                }`}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </span>

                {/* Avatar + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl">{trader.avatar}</span>
                  <div className="min-w-0">
                    <p className="text-gray-900 font-bold text-sm truncate">{trader.name}</p>
                    <p className="text-gray-400 text-xs font-mono">{trader.wallet}</p>
                  </div>
                </div>

                {/* Gains */}
                <div className="text-right shrink-0">
                  <p className="text-green-600 font-black text-base">+${trader.unrealizedGain.toLocaleString()}</p>
                  <p className="text-green-500 text-xs font-semibold">+{trader.unrealizedPct.toFixed(1)}%</p>
                </div>

                <span className="text-gray-300 ml-1">{expanded === trader.id ? "▲" : "▼"}</span>
              </button>

              {/* Expanded positions */}
              {expanded === trader.id && (
                <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 pt-3">
                    Open positions · avg hold {trader.holdDays} days
                  </p>
                  <div className="space-y-2">
                    {trader.positions.map((pos, i) => {
                      const gain    = (pos.currentPrice - pos.buyPrice) * pos.quantity;
                      const gainPct = ((pos.currentPrice - pos.buyPrice) / pos.buyPrice * 100).toFixed(1);
                      const isUp    = gain >= 0;
                      return (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 flex justify-between items-center">
                          <div>
                            <p className="text-gray-900 font-bold text-sm">{pos.playerName}</p>
                            <p className="text-gray-400 text-xs">{pos.quantity}x · bought {pos.buyDate} @ ${pos.buyPrice}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-sm ${isUp ? "text-green-600" : "text-red-600"}`}>
                              {isUp ? "+" : ""}${gain.toLocaleString()}
                            </p>
                            <p className={`text-xs ${isUp ? "text-green-500" : "text-red-500"}`}>
                              {isUp ? "+" : ""}{gainPct}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-gray-400 border-t border-gray-200 pt-2">
                    <span>Total invested: ${trader.totalInvested.toLocaleString()}</span>
                    <span>Avg hold: {trader.holdDays} days</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
