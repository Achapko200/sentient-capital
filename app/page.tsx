// ─── app/cards/page.tsx ──────────────────────────────────────────────────────
"use client";

import { useState }       from "react";
import { WATCHLIST }      from "../lib/players";
import PlayerCard         from "../components/cards/PlayerCard";
import NewsTickerCard     from "../components/cards/NewsTickerCard";

type Filter = "ALL" | "BUY" | "SELL" | "HOLD";

export default function CardsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");

  const filters: Filter[] = ["ALL", "BUY", "HOLD", "SELL"];

  const FILTER_STYLES: Record<Filter, string> = {
    ALL:  "bg-white/10 text-white",
    BUY:  "bg-green-500/20 text-green-400 border border-green-500/30",
    HOLD: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    SELL: "bg-red-500/20 text-red-400 border border-red-500/30",
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚾</span>
          <h1 className="text-4xl font-bold">Baseball Card Tracker</h1>
        </div>
        <p className="text-gray-400">
          Real MLB performance data · eBay price tracking · AI buy/sell signals
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f ? FILTER_STYLES[f] : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {WATCHLIST.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

        {/* Right: news + info */}
        <div className="space-y-4">
          <NewsTickerCard />

          {/* How it works */}
          <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">How signals work</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-green-400 font-bold w-10 shrink-0">BUY</span>
                <p className="text-gray-400">Strong recent performance + price hasn't moved yet. Early window before collectors pile in.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 font-bold w-10 shrink-0">HOLD</span>
                <p className="text-gray-400">Mixed signals or price already reflects performance. Wait for clearer entry/exit.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-400 font-bold w-10 shrink-0">SELL</span>
                <p className="text-gray-400">Slump detected or price elevated vs. recent performance. Sell into current demand.</p>
              </div>
            </div>
          </div>

          {/* Data sources */}
          <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">Data sources</h3>
            <div className="space-y-2 text-sm">
              {[
                { name: "MLB Stats API",  status: "LIVE",  color: "text-green-400" },
                { name: "ESPN News",      status: "LIVE",  color: "text-green-400" },
                { name: "eBay Sales",     status: "MOCK",  color: "text-yellow-400" },
                { name: "X Sentiment",    status: "SOON",  color: "text-gray-500" },
              ].map((s) => (
                <div key={s.name} className="flex justify-between items-center">
                  <span className="text-gray-400">{s.name}</span>
                  <span className={`text-xs font-bold ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
