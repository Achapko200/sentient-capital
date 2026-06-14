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

const LIQUIDITY_BG: Record<string, string> = {
  "VERY LIQUID": "bg-green-50 border-green-200",
  "LIQUID":      "bg-blue-50 border-blue-200",
  "MODERATE":    "bg-yellow-50 border-yellow-200",
  "THIN":        "bg-orange-50 border-orange-200",
  "ILLIQUID":    "bg-red-50 border-red-200",
};

function PctChange({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span className={`font-black text-sm ${isUp ? "text-green-600" : "text-red-600"}`}>
      {isUp ? "+" : ""}{value}%
    </span>
  );
}

function BaseballCard({ player, signal }: { player: Player; signal: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative rounded-lg overflow-hidden shrink-0"
      style={{
        width: 90,
        height: 126,
        background: `linear-gradient(145deg, ${player.cardColor}, ${player.teamColor})`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div className="absolute inset-0 opacity-20"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)" }} />

      <div className="absolute top-1 right-1 bg-black/40 text-white font-black px-1 rounded"
        style={{ fontSize: 7 }}>PSA 10</div>

      <div className="absolute inset-0 flex items-start justify-center pt-3 pb-8">
        {!imgError ? (
          <Image
            src={player.cardImage}
            alt={player.name}
            width={70}
            height={80}
            className="object-contain drop-shadow-lg"
            style={{ maxHeight: "65%", width: "auto" }}
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span className="text-4xl mt-2">⚾</span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
        style={{ background: "rgba(0,0,0,0.65)" }}>
        <p className="text-white font-black leading-tight truncate" style={{ fontSize: 8 }}>{player.name}</p>
        <p className="text-white/60" style={{ fontSize: 7 }}>{player.position}</p>
      </div>

      <div className={`absolute top-4 -left-5 -rotate-45 px-6 py-px font-black ${
        signal === "BUY"  ? "bg-green-500 text-white" :
        signal === "SELL" ? "bg-red-500 text-white" :
        "bg-yellow-400 text-yellow-900"
      }`} style={{ fontSize: 7 }}>
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
      // retry
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
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="shrink-0 rounded-lg bg-gray-100" style={{ width: 90, height: 126 }} />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-6 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.cardSignal) return null;

  const { stats, sales, sentiment, cardSignal, avgPrice, priceChange, priceHistory, liquidity } = data;
  const isUp        = priceChange >= 0;
  const borderClass = SIGNAL_BORDER[cardSignal.signal] ?? "border-gray-200";
  const liqBg       = LIQUIDITY_BG[liquidity.label] ?? "bg-gray-50 border-gray-200";

  return (
    <div className={`bg-white rounded-2xl border-2 ${borderClass} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>

      {/* TOP ROW */}
      <div className="flex items-start gap-3 p-4 pb-3">

        {/* Card image — top left */}
        <BaseballCard player={player} signal={cardSignal.signal} />

        {/* Right content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* Name + % gain top right */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-gray-900 font-black text-sm leading-tight truncate">{player.name}</h3>
              <p className="text-gray-400 text-xs truncate">{player.team}</p>
              <p className="text-gray-300 text-xs truncate">{player.cardName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-black leading-none ${isUp ? "text-green-600" : "text-red-600"}`}>
                {isUp ? "+" : ""}{priceChange}%
              </p>
              <p className="text-gray-400 text-xs mt-0.5">14-day</p>
            </div>
          </div>

          {/* Signal */}
          <SignalBadge signal={cardSignal.signal} confidence={cardSignal.confidence} />

          {/* Avg price + target */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <p className="text-gray-400 text-xs">Avg PSA 10</p>
              <p className="text-gray-900 text-xl font-black">${avgPrice}</p>
            </div>
            {cardSignal.buyBelow && (
              <div>
                <p className="text-gray-400 text-xs">Buy below</p>
                <p className="text-green-600 font-black text-sm">${cardSignal.buyBelow}</p>
              </div>
            )}
            {cardSignal.sellAbove && !cardSignal.buyBelow && (
              <div>
                <p className="text-gray-400 text-xs">Sell above</p>
                <p className="text-red-600 font-black text-sm">${cardSignal.sellAbove}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRICE HISTORY — 1W / 3M / 1Y */}
      <div className="mx-4 mb-3 rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          {[
            { label: "1 Week",   data: priceHistory.week },
            { label: "3 Months", data: priceHistory.threeMonth },
            { label: "1 Year",   data: priceHistory.year },
          ].map((period) => {
            const up = period.data.changePct >= 0;
            return (
              <div key={period.label} className="p-3 text-center">
                <p className="text-gray-400 text-xs mb-1">{period.label}</p>
                <PctChange value={period.data.changePct} />
                <p className="text-gray-400 text-xs mt-0.5">
                  ${period.data.previous} → ${period.data.current}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIQUIDITY */}
      <div className={`mx-4 mb-3 rounded-lg p-3 border ${liqBg}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Liquidity</span>
          <span className={`text-xs font-black ${liquidity.color}`}>{liquidity.label}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              liquidity.score >= 80 ? "bg-green-500" :
              liquidity.score >= 55 ? "bg-blue-500" :
              liquidity.score >= 35 ? "bg-yellow-400" :
              liquidity.score >= 18 ? "bg-orange-400" : "bg-red-500"
            }`}
            style={{ width: `${liquidity.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>~{liquidity.salesPerMonth} sales/month</span>
          <span>~{liquidity.daysToSell} days to sell</span>
        </div>
      </div>

      {/* SENTIMENT */}
      <div className="mx-4 mb-3 rounded-lg p-3 bg-gray-50 border border-gray-200">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Sentiment</span>
          <span className={`text-xs font-black ${SENTIMENT_COLOR[sentiment.label] ?? "text-gray-600"}`}>
            {sentiment.label}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
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

      {/* CHART */}
      {sales.length > 0 && (
        <div className="mx-4 mb-3">
          <PriceChart sales={sales} />
        </div>
      )}

      {/* EXPAND */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-xs font-semibold hover:text-blue-700 transition"
        >
          {expanded ? "▲ Hide details" : "▼ Show stats & reasoning"}
        </button>

        {expanded && (
          <div className="space-y-3 mt-3">
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
