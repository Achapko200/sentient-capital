// components/cards/PlayerProfileClient.tsx
"use client";

import { useState }        from "react";
import { useRouter }       from "next/navigation";
import Image               from "next/image";
import type { Player, MLBStats, EbaySale, PriceHistory, LiquidityScore, SentimentScore, CardSignal } from "@/lib/cardTypes";
import type { CardAnalysis } from "@/lib/analyst";
import SignalBadge          from "@/components/cards/SignalBadge";
import PriceChart           from "@/components/cards/PriceChart";

type Props = {
  player:      Player;
  stats:       MLBStats | null;
  sales:       EbaySale[];
  avgPrice:    number;
  priceChange: number;
  priceHistory: PriceHistory;
  liquidity:   LiquidityScore;
  sentiment:   SentimentScore;
  cardSignal:  CardSignal;
  analysis:    CardAnalysis;
};

const SENTIMENT_COLOR: Record<string, string> = {
  "VERY BULLISH": "text-green-400",
  "BULLISH":      "text-green-400",
  "NEUTRAL":      "text-yellow-400",
  "BEARISH":      "text-red-400",
  "VERY BEARISH": "text-red-400",
};

const RATING_STYLE: Record<string, string> = {
  "STRONG BUY":  "bg-green-900 text-green-400 border-green-700",
  "BUY":         "bg-emerald-900 text-emerald-400 border-emerald-700",
  "HOLD":        "bg-yellow-900 text-yellow-400 border-yellow-700",
  "SELL":        "bg-orange-900 text-orange-400 border-orange-700",
  "STRONG SELL": "bg-red-900 text-red-400 border-red-700",
};

export default function PlayerProfileClient({
  player, stats, sales, avgPrice, priceChange,
  priceHistory, liquidity, sentiment, cardSignal, analysis,
}: Props) {
  const router  = useRouter();
  const [tab, setTab] = useState<"overview" | "stats" | "sales" | "analysts">("overview");
  const [imgError, setImgError] = useState(false);
  const isUp = priceChange >= 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition text-sm">
          ← Back
        </button>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400 text-sm">{player.team}</span>
      </div>

      {/* Hero */}
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="flex items-start gap-6 mb-8">

          {/* Card visual */}
          <div className="relative rounded-2xl overflow-hidden shrink-0"
            style={{
              width: 140, height: 196,
              background: `linear-gradient(145deg, ${player.cardColor}, ${player.teamColor})`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)" }} />
            <div className="absolute top-2 right-2 bg-black/50 text-white font-black px-1.5 py-0.5 rounded text-xs">
              PSA 10
            </div>
            <div className="absolute inset-0 flex items-center justify-center pt-4 pb-12">
              {!imgError ? (
                <Image src={player.cardImage} alt={player.name}
                  width={110} height={120}
                  className="object-contain drop-shadow-2xl"
                  onError={() => setImgError(true)} unoptimized />
              ) : (
                <span className="text-6xl">⚾</span>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              <p className="text-white font-black text-xs truncate">{player.name}</p>
              <p className="text-white/60 text-xs">{player.position}</p>
            </div>
            <div className={`absolute top-6 -left-7 -rotate-45 px-10 py-0.5 font-black text-xs ${
              cardSignal.signal === "BUY"  ? "bg-green-500 text-white" :
              cardSignal.signal === "SELL" ? "bg-red-500 text-white" :
              "bg-yellow-400 text-yellow-900"
            }`}>
              {cardSignal.signal}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-black mb-1">{player.name}</h1>
            <p className="text-gray-400 mb-4">{player.team} · {player.position}</p>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <SignalBadge signal={cardSignal.signal} confidence={cardSignal.confidence} />
              <span className={`text-2xl font-black ${isUp ? "text-green-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{priceChange}% <span className="text-sm font-normal text-gray-500">14-day</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-500 text-xs mb-1">Avg PSA 10</p>
                <p className="text-2xl font-black">${avgPrice}</p>
              </div>
              {cardSignal.buyBelow && (
                <div className="bg-green-950 rounded-xl p-4 border border-green-800">
                  <p className="text-green-500 text-xs mb-1">Buy below</p>
                  <p className="text-2xl font-black text-green-400">${cardSignal.buyBelow}</p>
                </div>
              )}
              {cardSignal.sellAbove && (
                <div className="bg-red-950 rounded-xl p-4 border border-red-800">
                  <p className="text-red-500 text-xs mb-1">Sell above</p>
                  <p className="text-2xl font-black text-red-400">${cardSignal.sellAbove}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push(`/?tab=trade&player=${player.id}`)}
              className={`px-6 py-3 rounded-xl font-black text-sm transition ${
                cardSignal.signal === "BUY"
                  ? "bg-green-600 hover:bg-green-500"
                  : cardSignal.signal === "SELL"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}>
              📊 Trade {player.name.split(" ").pop()} shares
            </button>
          </div>
        </div>

        {/* Price history bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "1 Week",   data: priceHistory.week       },
            { label: "3 Months", data: priceHistory.threeMonth },
            { label: "1 Year",   data: priceHistory.year       },
          ].map(period => {
            const up = period.data.changePct >= 0;
            return (
              <div key={period.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <p className="text-gray-500 text-xs mb-1">{period.label}</p>
                <p className={`text-xl font-black ${up ? "text-green-400" : "text-red-400"}`}>
                  {up ? "+" : ""}{period.data.changePct}%
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  ${period.data.previous} → ${period.data.current}
                </p>
              </div>
            );
          })}
        </div>

        {/* Sub tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {(["overview", "stats", "sales", "analysts"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-bold capitalize transition border-b-2 -mb-px ${
                tab === t
                  ? "text-white border-blue-500"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Sentiment</h3>
                <span className={`text-sm font-black ${SENTIMENT_COLOR[sentiment.label] ?? "text-gray-400"}`}>
                  {sentiment.label}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${
                  sentiment.score >= 60 ? "bg-green-500" :
                  sentiment.score >= 40 ? "bg-yellow-400" : "bg-red-500"
                }`} style={{ width: `${sentiment.score}%` }} />
              </div>
              <ul className="space-y-1.5">
                {sentiment.reasons.map((r, i) => (
                  <li key={i} className="text-gray-400 text-sm">• {r}</li>
                ))}
              </ul>
            </div>

            {/* Liquidity */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Liquidity</h3>
                <span className={`text-sm font-black ${liquidity.color}`}>{liquidity.label}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${
                  liquidity.score >= 80 ? "bg-green-500" :
                  liquidity.score >= 55 ? "bg-blue-500"  :
                  liquidity.score >= 35 ? "bg-yellow-400" :
                  liquidity.score >= 18 ? "bg-orange-400" : "bg-red-500"
                }`} style={{ width: `${liquidity.score}%` }} />
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>~{liquidity.salesPerMonth} sales/month</span>
                <span>~{liquidity.daysToSell} days to sell</span>
              </div>
            </div>

            {/* Signal reasoning */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 lg:col-span-2">
              <h3 className="font-bold mb-3">Signal reasoning</h3>
              <ul className="space-y-2">
                {cardSignal.reasons.map((r, i) => (
                  <li key={i} className="text-gray-400 text-sm flex gap-2">
                    <span className="text-blue-400 shrink-0">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price chart */}
            {sales.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 lg:col-span-2">
                <h3 className="font-bold mb-3">Price chart — last 14 days</h3>
                <PriceChart sales={sales} />
              </div>
            )}
          </div>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div className="space-y-4">
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Batting AVG", value: stats.avg.toFixed(3)  },
                    { label: "Home Runs",   value: String(stats.hr)       },
                    { label: "RBI",         value: String(stats.rbi)      },
                    { label: "OPS",         value: stats.ops.toFixed(3)  },
                    { label: "Hits",        value: String(stats.hits)     },
                    { label: "Games",       value: String(stats.games)    },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 text-center">
                      <p className="text-gray-500 text-xs mb-2">{s.label}</p>
                      <p className="text-3xl font-black">{s.value}</p>
                    </div>
                  ))}
                </div>

                {stats.lastGame && (
                  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                    <h3 className="font-bold mb-3">Last game — {stats.lastGame.date}</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { label: "Hits",      value: stats.lastGame.hits },
                        { label: "Home Runs", value: stats.lastGame.hr   },
                        { label: "RBI",       value: stats.lastGame.rbi  },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-800 rounded-xl p-4">
                          <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                          <p className="text-2xl font-black">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-10 text-center border border-gray-800">
                <p className="text-gray-400">No stats available for this player</p>
              </div>
            )}
          </div>
        )}

        {/* SALES */}
        {tab === "sales" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold">Recent eBay sales — PSA 10</h3>
              <p className="text-gray-500 text-xs mt-0.5">Last 14 days · {sales.length} sales</p>
            </div>
            {sales.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm">No recent sales data</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {sales.map((s, i) => (
                  <div key={s.id} className="flex justify-between items-center px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold">{s.condition}</p>
                        <p className="text-gray-500 text-xs">{s.date}</p>
                      </div>
                    </div>
                    <p className="font-black text-lg">${s.price}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-800 flex justify-between text-sm">
              <span className="text-gray-500">Average</span>
              <span className="font-black">${avgPrice}</span>
            </div>
          </div>
        )}

        {/* ANALYSTS */}
        {tab === "analysts" && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs mb-1">Consensus rating</p>
                <p className="text-2xl font-black">{analysis.consensusRating}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs mb-1">Avg price target</p>
                <p className="text-2xl font-black">${analysis.avgPriceTarget}</p>
              </div>
            </div>

            {analysis.calls.map((call, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{call.analyst.avatar}</span>
                    <div>
                      <p className="font-bold">{call.analyst.name}</p>
                      <p className="text-gray-500 text-xs">{call.analyst.firm} · {call.analyst.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black px-2 py-1 rounded-full border ${RATING_STYLE[call.rating] ?? ""}`}>
                      {call.rating}
                    </span>
                    <p className="text-gray-400 text-xs mt-1">
                      Target: <span className="text-white font-bold">${call.priceTarget}</span>
                      <span className={`ml-1 ${call.upside >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ({call.upside >= 0 ? "+" : ""}{call.upside}%)
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{call.thesis}</p>
                <div className="flex justify-between mt-3 text-xs text-gray-600">
                  <span>{call.date}</span>
                  <span>{call.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}