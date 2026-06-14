"use client";

import { WATCHLIST }      from "@/lib/players";
import PlayerCard         from "@/components/cards/PlayerCard";
import NewsTickerCard     from "@/components/cards/NewsTickerCard";

export default function Home() {
  return (
    <div className="min-h-screen text-white" style={{
      background: "linear-gradient(135deg, #06060f 0%, #0d0d2b 40%, #06060f 100%)"
    }}>

      <div className="h-1 w-full" style={{
        background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)"
      }} />

      <div className="p-8">

        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-5xl">⚾</span>
            <div>
              <h1 className="text-5xl font-black tracking-tight" style={{
                background: "linear-gradient(90deg, #ffffff, #93c5fd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Card Tracker
              </h1>
              <p className="text-blue-300 text-sm font-medium mt-1">
                Real MLB data · eBay prices · AI buy/sell signals
              </p>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            {[
              { label: "Players tracked", value: "6" },
              { label: "MLB Stats", value: "LIVE" },
              { label: "eBay prices", value: "MOCK" },
              { label: "Signal engine", value: "ON" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-gray-500 text-xs uppercase tracking-wider">{s.label}</span>
                <span className="text-white text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {WATCHLIST.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          <div className="space-y-4">
            <NewsTickerCard />

            <div className="rounded-xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
              <h3 className="text-white font-bold text-base mb-4">How signals work</h3>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <span className="text-sm font-black px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">BUY</span>
                  <p className="text-gray-300 text-sm leading-relaxed">Strong performance + price has not moved yet. Get in before collectors pile in.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-sm font-black px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">HOLD</span>
                  <p className="text-gray-300 text-sm leading-relaxed">Mixed signals or price already reflects performance. Wait for a clearer window.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-sm font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">SELL</span>
                  <p className="text-gray-300 text-sm leading-relaxed">Slump or price elevated vs. performance. Sell into current demand now.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
              <h3 className="text-white font-bold text-base mb-4">Data sources</h3>
              <div className="space-y-3">
                {[
                  { name: "MLB Stats API", status: "LIVE",    dot: "bg-green-400" },
                  { name: "ESPN News",     status: "LIVE",    dot: "bg-green-400" },
                  { name: "eBay Sales",    status: "PENDING", dot: "bg-yellow-400" },
                  { name: "X Sentiment",  status: "SOON",    dot: "bg-gray-600" },
                ].map((s) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="text-gray-300 text-sm">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{s.status}</span>
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
