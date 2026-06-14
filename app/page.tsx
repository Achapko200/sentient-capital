"use client";

import { WATCHLIST }      from "@/lib/players";
import PlayerCard         from "@/components/cards/PlayerCard";
import NewsTickerCard     from "@/components/cards/NewsTickerCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{
        background: "linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #d97706)"
      }} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">⚾</span>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Card Tracker</h1>
              <p className="text-gray-500 text-sm mt-0.5">Real MLB data · eBay prices · AI buy/sell signals</p>
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { label: "MLB Stats", color: "bg-green-100 text-green-700 border-green-200" },
              { label: "ESPN News", color: "bg-green-100 text-green-700 border-green-200" },
              { label: "eBay Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { label: "X Soon", color: "bg-gray-100 text-gray-500 border-gray-200" },
            ].map((s) => (
              <span key={s.label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cards grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {WATCHLIST.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            <NewsTickerCard />

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 font-bold text-base mb-4">How signals work</h3>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <span className="text-xs font-black px-2 py-1 rounded-lg bg-green-100 text-green-700 border border-green-200 shrink-0">BUY</span>
                  <p className="text-gray-600 text-sm leading-relaxed">Strong performance + price has not moved yet. Get in before collectors pile in.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xs font-black px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200 shrink-0">HOLD</span>
                  <p className="text-gray-600 text-sm leading-relaxed">Mixed signals or price already reflects performance. Wait for a clearer window.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xs font-black px-2 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200 shrink-0">SELL</span>
                  <p className="text-gray-600 text-sm leading-relaxed">Slump or price elevated vs. performance. Sell into current demand now.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 font-bold text-base mb-4">Data sources</h3>
              <div className="space-y-3">
                {[
                  { name: "MLB Stats API", status: "LIVE",    dot: "bg-green-500",  text: "text-green-600" },
                  { name: "ESPN News",     status: "LIVE",    dot: "bg-green-500",  text: "text-green-600" },
                  { name: "eBay Sales",    status: "PENDING", dot: "bg-yellow-400", text: "text-yellow-600" },
                  { name: "X Sentiment",  status: "SOON",    dot: "bg-gray-300",   text: "text-gray-400" },
                ].map((s) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="text-gray-700 text-sm">{s.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${s.text}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

