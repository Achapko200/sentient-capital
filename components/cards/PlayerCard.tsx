"use client";

import { useEffect, useState, useCallback } from "react";
import type { CardData, Player }            from "@/lib/cardTypes";
import SignalBadge  from "@/components/cards/SignalBadge";
import PriceChart   from "@/components/cards/PriceChart";

const SENTIMENT_COLOR: Record<string, string> = {
  "VERY BULLISH": "text-green-300",
  "BULLISH":      "text-green-400",
  "NEUTRAL":      "text-yellow-400",
  "BEARISH":      "text-red-400",
  "VERY BEARISH": "text-red-300",
};

const SIGNAL_BORDER: Record<string, string> = {
  BUY:  "border-green-500/40",
  SELL: "border-red-500/40",
  HOLD: "border-yellow-500/30",
};

export default function PlayerCard({ player }: { player: Player }) {
  const [data,     setData]     = useState<CardData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/cards/${player.id}`);
      const json = await res.json();
      setData(json);
    } catch {
      // retry on next interval
    } finally {
      setLoading(false);
    }
  }, [player.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl p-5 border border-white/10 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-4 bg-white/10 rounded w-32 mb-3" />
        <div className="h-8 bg-white/10 rounded w-20 mb-2" />
        <div className="h-3 bg-white/10 rounded w-full mb-1" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
      </div>
    );
  }

  if (!data || !data.cardSignal) return null;

  const { stats, sales, sentiment, cardSignal, avgPrice, priceChange } = data;
  const isUp = priceChange >= 0;
  const borderClass = SIGNAL_BORDER[cardSignal.signal] ?? "border-white/10";

  return (
    <div className={`rounded-xl p-5 border ${borderClass} flex flex-col gap-4 transition-all hover:border-opacity-80`}
      style={{ background: "rgba(10,10,30,0.8)", backdropFilter: "blur(10px)" }}>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">⚾</span>
            <h3 className="text-white font-black text-base">{player.name}</h3>
            <span className="text-blue-400 text-xs font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">{player.position}</span>
          </div>
          <p className="text-gray-400 text-xs">{player.team}</p>
          <p className="text-gray-600 text-xs mt-0.5">{player.cardName}</p>
        </div>
        <SignalBadge signal={cardSignal.signal} confidence={cardSignal.confidence} />
      </div>

      {/* Price row */}
      <div className="flex items-end gap-5">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Avg sale (PSA 10)</p>
          <p className="text-white text-3xl font-black">${avgPrice}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">14-day</p>
          <p className={`text-xl font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{priceChange}%
          </p>
        </div>
        <div className="ml-auto text-right">
          {cardSignal.buyBelow && (
            <div>
              <p className="text-gray-500 text-xs">Buy below</p>
              <p className="text-green-400 font-bold text-lg">${cardSignal.buyBelow}</p>
            </div>
          )}
          {cardSignal.sellAbove && !cardSignal.buyBelow && (
            <div>
              <p className="text-gray-500 text-xs">Sell above</p>
              <p className="text-red-400 font-bold text-lg">${cardSignal.sellAbove}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {sales.length > 0 && <PriceChart sales={sales} />}

      {/* Sentiment */}
      <div className="rounded-lg p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">AI Sentiment</span>
          <span className={`text-xs font-black ${SENTIMENT_COLOR[sentiment.label] ?? "text-gray-400"}`}>
            {sentiment.label}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              sentiment.score >= 60 ? "bg-green-500" : sentiment.score >= 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${sentiment.score}%` }}
          />
        </div>
        <ul className="space-y-0.5">
          {sentiment.reasons.slice(0, 2).map((r, i) => (
            <li key={i} className="text-gray-300 text-xs">• {r}</li>
          ))}
        </ul>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-blue-400 text-xs text-left hover:text-blue-300 transition font-medium"
      >
        {expanded ? "▲ Hide details" : "▼ Show stats & reasoning"}
      </button>

      {expanded && (
        <div className="space-y-3">
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "AVG", value: stats.avg.toFixed(3) },
                { label: "HR",  value: String(stats.hr) },
                { label: "RBI", value: String(stats.rbi) },
                { label: "OPS", value: stats.ops.toFixed(3) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-2 text-center border border-white/5" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className="text-white font-black text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {stats?.lastGame && (
            <div className="rounded-lg p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-gray-400 text-xs font-semibold mb-1">Last game — {stats.lastGame.date}</p>
              <p className="text-white font-bold">
                {stats.lastGame.hits}H · {stats.lastGame.hr}HR · {stats.lastGame.rbi}RBI
              </p>
            </div>
          )}

          <div className="rounded-lg p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-gray-400 text-xs font-semibold mb-2">Signal reasoning</p>
            <ul className="space-y-1">
              {cardSignal.reasons.map((r, i) => (
                <li key={i} className="text-gray-200 text-xs">• {r}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-gray-400 text-xs font-semibold mb-2">Recent eBay sales</p>
            <div className="space-y-1.5">
              {sales.slice(0, 4).map((s) => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span className="text-gray-500">{s.date}</span>
                  <span className="text-white font-bold">${s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
