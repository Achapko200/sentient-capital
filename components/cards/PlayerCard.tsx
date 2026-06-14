"use client";

// ─── components/cards/PlayerCard.tsx ─────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import type { CardData, Player }            from "@/lib/cardTypes";
import SignalBadge  from "./SignalBadge";

// Local lightweight PriceChart fallback to avoid import errors when the
// external component is not present. Renders a simple sparkline-like bar
// visualization for the provided sales data.
function PriceChart({ sales }: { sales: { price: number; date?: string; id?: string }[] }) {
  if (!sales || sales.length === 0) return null;
  const prices = sales.map((s) => s.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = Math.max(1, max - min);

  return (
    <div className="w-full h-20 flex items-end gap-1">
      {prices.map((p, i) => (
        <div
          key={i}
          style={{ height: `${((p - min) / range) * 100}%` }}
          className="flex-1 bg-white/10 rounded"
          title={`$${p}`}
        />
      ))}
    </div>
  );
}

const SENTIMENT_COLOR: Record<string, string> = {
  "VERY BULLISH": "text-green-400",
  "BULLISH":      "text-green-400",
  "NEUTRAL":      "text-yellow-400",
  "BEARISH":      "text-red-400",
  "VERY BEARISH": "text-red-400",
};

export default function PlayerCard({ player }: { player: Player }) {
  const [data,      setData]      = useState<CardData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/cards/${player.id}`);
      const json = await res.json();
      setData(json);
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, [player.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-32 mb-3" />
        <div className="h-8 bg-gray-800 rounded w-20 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-full mb-1" />
        <div className="h-3 bg-gray-800 rounded w-3/4" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, sales, sentiment, cardSignal, avgPrice, priceChange } = data;
  const isUp = priceChange >= 0;

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-600 transition-colors">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{player.image}</span>
            <h3 className="text-white font-bold">{player.name}</h3>
            <span className="text-gray-500 text-xs">{player.position}</span>
          </div>
          <p className="text-gray-500 text-xs">{player.team}</p>
          <p className="text-gray-600 text-xs mt-0.5">{player.cardName}</p>
        </div>
        <SignalBadge signal={cardSignal.signal} confidence={cardSignal.confidence} />
      </div>

      {/* Price row */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Avg sale (PSA 10)</p>
          <p className="text-white text-2xl font-bold">${avgPrice}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">14-day change</p>
          <p className={`text-lg font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{priceChange}%
          </p>
        </div>
        {cardSignal.buyBelow && (
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Buy below</p>
            <p className="text-green-400 font-semibold">${cardSignal.buyBelow}</p>
          </div>
        )}
        {cardSignal.sellAbove && (
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Sell above</p>
            <p className="text-red-400 font-semibold">${cardSignal.sellAbove}</p>
          </div>
        )}
      </div>

      {/* Price chart */}
      {sales.length > 0 && <PriceChart sales={sales} />}

      {/* Sentiment */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-xs font-medium">AI Sentiment</span>
          <span className={`text-xs font-bold ${SENTIMENT_COLOR[sentiment.label] ?? "text-gray-400"}`}>
            {sentiment.label}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              sentiment.score >= 60 ? "bg-green-500" : sentiment.score >= 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${sentiment.score}%` }}
          />
        </div>
        <ul className="space-y-0.5">
          {sentiment.reasons.slice(0, 2).map((r, i) => (
            <li key={i} className="text-gray-400 text-xs">• {r}</li>
          ))}
        </ul>
      </div>

      {/* Stats + signal reasons toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-gray-500 text-xs text-left hover:text-gray-300 transition"
      >
        {expanded ? "▲ Hide details" : "▼ Show stats & signal reasons"}
      </button>

      {expanded && (
        <div className="space-y-3">

          {/* MLB Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "AVG",   value: stats.avg.toFixed(3) },
                { label: "HR",    value: String(stats.hr) },
                { label: "RBI",   value: String(stats.rbi) },
                { label: "OPS",   value: stats.ops.toFixed(3) },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className="text-white font-semibold text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Last game */}
          {stats?.lastGame && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-400 text-xs font-medium mb-1">Last game — {stats.lastGame.date}</p>
              <p className="text-white text-sm">
                {stats.lastGame.hits}H · {stats.lastGame.hr}HR · {stats.lastGame.rbi}RBI
              </p>
            </div>
          )}

          {/* Signal reasons */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs font-medium mb-2">Signal reasoning</p>
            <ul className="space-y-1">
              {cardSignal.reasons.map((r, i) => (
                <li key={i} className="text-gray-300 text-xs">• {r}</li>
              ))}
            </ul>
          </div>

          {/* Recent eBay sales */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs font-medium mb-2">Recent eBay sales</p>
            <div className="space-y-1">
              {sales.slice(0, 4).map((s) => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span className="text-gray-500">{s.date}</span>
                  <span className="text-white font-medium">${s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
