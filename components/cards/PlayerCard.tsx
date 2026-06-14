"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import type { CardData, Player } from "@/lib/cardTypes";
import SignalBadge from "@/components/cards/SignalBadge";
import PriceChart  from "@/components/cards/PriceChart";

const SENTIMENT_COLOR: Record<string, string> = {
  "VERY BULLISH": "text-green-600",
  "BULLISH":      "text-green-600",
  "NEUTRAL":      "text-yellow-600",
  "BEARISH":      "text-red-600",
  "VERY BEARISH": "text-red-600",
};

const SIGNAL_BORDER: Record<string, string> = {
  BUY:  "border-green-400",
  SELL: "border-red-400",
  HOLD: "border-yellow-400",
};

const SIGNAL_GLOW: Record<string, string> = {
  BUY:  "shadow-green-200",
  SELL: "shadow-red-200",
  HOLD: "shadow-yellow-200",
};

function BaseballCard({ player, signal }: { player: Player; signal: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative rounded-xl overflow-hidden mx-auto"
      style={{
        width: "100%",
        maxWidth: 280,
        aspectRatio: "2.5/3.5",
        background: `linear-gradient(145deg, ${player.cardColor}, ${player.teamColor})`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      {/* Card shine overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)"
        }}
      />

      {/* Top label */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-3 py-2 z-10">
        <span className="text-white text-xs font-black opacity-90 uppercase tracking-widest"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
          {player.cardName.split(" ")[0]} {player.cardName.split(" ")[1]}
        </span>
        <span className="text-white text-xs font-bold opacity-80 bg-black/30 px-1.5 py-0.5 rounded">
          PSA 10
        </span>
      </div>

      {/* Player photo */}
      <div className="absolute inset-0 flex items-center justify-center pt-6 pb-14">
        {!imgError ? (
          <Image
            src={player.cardImage}
            alt={player.name}
            width={200}
            height={220}
            className="object-contain drop-shadow-2xl"
            style={{ maxHeight: "75%", width: "auto" }}
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center opacity-60">
            <span className="text-6xl">⚾</span>
            <span className="text-white text-sm font-bold mt-2 opacity-80">
              {player.name.split(" ").pop()}
            </span>
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
        <p className="text-white font-black text-sm leading-tight">{player.name}</p>
        <div className="flex justify-between items-center">
          <p className="text-white/70 text-xs">{player.team}</p>
          <p className="text-white/70 text-xs font-bold">{player.position}</p>
        </div>
      </div>

      {/* Signal ribbon */}
      <div className={`absolute top-3 -right-6 rotate-45 px-8 py-0.5 text-xs font-black ${
        signal === "BUY"  ? "bg-green-500 text-white" :
        signal === "SELL" ? "bg-red-500 text-white" :
        "bg-yellow-400 text-yellow-900"
      }`}>
        {signal}
      </div>
    </div>
  );
}

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
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden animate-pulse">
        <div className="h-64 bg-gray-100" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-8 bg-gray-100 rounded w-20" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!data || !data.cardSignal) return null;

  const { stats, sales, sentiment, cardSignal, avgPrice, priceChange } = data;
  const isUp        = priceChange >= 0;
  const borderClass = SIGNAL_BORDER[cardSignal.signal] ?? "border-gray-200";
  const glowClass   = SIGNAL_GLOW[cardSignal.signal]  ?? "";

  return (
    <div className={`bg-white rounded-2xl border-2 ${borderClass} shadow-lg ${glowClass} overflow-hidden flex flex-col hover:shadow-xl transition-shadow`}>

      {/* Card visual */}
      <div className="p-4 pb-2 bg-gray-50 border-b border-gray-100">
        <BaseballCard player={player} signal={cardSignal.signal} />
      </div>

      {/* Info section */}
      <div className="p-4 flex flex-col gap-3">

        {/* Name + signal */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-900 font-black text-base">{player.name}</h3>
            <p className="text-gray-400 text-xs">{player.cardName}</p>
          </div>
          <SignalBadge signal={cardSignal.signal} confidence={cardSignal.confidence} />
        </div>

        {/* Price row */}
        <div className="flex items-end gap-4">
          <div>
            <p className="text-gray-400 text-xs">Avg PSA 10 sale</p>
            <p className="text-gray-900 text-2xl font-black">${avgPrice}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">14-day</p>
            <p className={`text-lg font-bold ${isUp ? "text-green-600" : "text-red-600"}`}>
              {isUp ? "+" : ""}{priceChange}%
            </p>
          </div>
          <div className="ml-auto text-right">
            {cardSignal.buyBelow && (
              <>
                <p className="text-gray-400 text-xs">Buy below</p>
                <p className="text-green-600 font-black text-lg">${cardSignal.buyBelow}</p>
              </>
            )}
            {cardSignal.sellAbove && !cardSignal.buyBelow && (
              <>
                <p className="text-gray-400 text-xs">Sell above</p>
                <p className="text-red-600 font-black text-lg">${cardSignal.sellAbove}</p>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        {sales.length > 0 && <PriceChart sales={sales} />}

        {/* Sentiment bar */}
        <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Sentiment</span>
            <span className={`text-xs font-black ${SENTIMENT_COLOR[sentiment.label] ?? "text-gray-600"}`}>
              {sentiment.label}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                sentiment.score >= 60 ? "bg-green-500" :
                sentiment.score >= 40 ? "bg-yellow-400" : "bg-red-500"
              }`}
              style={{ width: `${sentiment.score}%` }}
            />
          </div>
          <ul className="space-y-0.5">
            {sentiment.reasons.slice(0, 2).map((r, i) => (
              <li key={i} className="text-gray-500 text-xs">• {r}</li>
            ))}
          </ul>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-xs font-semibold hover:text-blue-700 transition text-left"
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
                  <div key={s.label} className="rounded-lg p-2 text-center bg-gray-50 border border-gray-200">
                    <p className="text-gray-400 text-xs">{s.label}</p>
                    <p className="text-gray-900 font-black text-sm">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {stats?.lastGame && (
              <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
                <p className="text-gray-500 text-xs font-semibold mb-1">Last game — {stats.lastGame.date}</p>
                <p className="text-gray-900 font-bold text-sm">
                  {stats.lastGame.hits}H · {stats.lastGame.hr}HR · {stats.lastGame.rbi}RBI
                </p>
              </div>
            )}

            <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
              <p className="text-gray-500 text-xs font-semibold mb-2">Signal reasoning</p>
              <ul className="space-y-1">
                {cardSignal.reasons.map((r, i) => (
                  <li key={i} className="text-gray-700 text-xs">• {r}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
              <p className="text-gray-500 text-xs font-semibold mb-2">Recent eBay sales</p>
              <div className="space-y-1.5">
                {sales.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-gray-400">{s.date}</span>
                    <span className="text-gray-900 font-bold">${s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
