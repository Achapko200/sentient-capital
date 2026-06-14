"use client";

import { useState }          from "react";
import { WATCHLIST }         from "@/lib/players";
import PlayerCard            from "@/components/cards/PlayerCard";
import NewsTickerCard        from "@/components/cards/NewsTickerCard";
import TraderLeaderboard     from "@/components/cards/TraderLeaderboard";
import AnalystPanel          from "@/components/cards/AnalystPanel";

type Tab = "cards" | "traders" | "analysts";

export default function Home() {
  const [tab, setTab] = useState<Tab>("cards");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "cards",   label: "Card Tracker",  icon: "⚾" },
    { id: "traders", label: "Trader Gains",  icon: "📈" },
    { id: "analysts",label: "Analyst Picks", icon: "🎓" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{
        background: "linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #d97706)"
      }} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">⚾</span>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Card Tracker</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Real MLB data · eBay prices · AI signals · Crypto payments
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: "MLB Live",   color: "bg-green-100 text-green-700 border-green-200" },
              { label: "ESPN Live",  color: "bg-green-100 text-green-700 border-green-200" },
              { label: "eBay Mock",  color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { label: "⟠ ETH · ◎ SOL · ₿ BTC", color: "bg-purple-100 text-purple-700 border-purple-200" },
            ].map((s) => (
              <span key={s.label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* CARDS TAB */}
        {tab === "cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {WATCHLIST.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
            <div className="space-y-4">
              <NewsTickerCard />
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-4">How signals work</h3>
                <div className="space-y-4">
                  {[
                    { signal: "BUY",  color: "bg-green-100 text-green-700 border-green-200",  desc: "Strong performance + price hasn't moved yet. Early window before collectors pile in." },
                    { signal: "HOLD", color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Mixed signals or price already reflects performance. Wait for a clearer window." },
                    { signal: "SELL", color: "bg-red-100 text-red-700 border-red-200",         desc: "Slump or price elevated vs. performance. Sell into current demand now." },
                  ].map((s) => (
                    <div key={s.signal} className="flex gap-3 items-start">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg border shrink-0 ${s.color}`}>{s.signal}</span>
                      <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-3">Crypto payments</h3>
                <p className="text-gray-500 text-sm mb-3">Pay or receive payment for cards in crypto. Click any card and tap the crypto button.</p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { icon: "⟠", label: "ETH",  color: "text-blue-500" },
                    { icon: "◎", label: "SOL",  color: "text-purple-500" },
                    { icon: "$", label: "USDC", color: "text-blue-400" },
                    { icon: "₿", label: "BTC",  color: "text-orange-500" },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                      <span className={`font-bold ${t.color}`}>{t.icon}</span>
                      <span className="text-gray-700 text-xs font-bold">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRADERS TAB */}
        {tab === "traders" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TraderLeaderboard />
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">What is unrealized gain?</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Unrealized gain is profit on cards you still own — the difference between what you paid and what they're worth today. It becomes real when you sell.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Avg hold times</h3>
                <p className="text-gray-500 text-sm">Short-term traders flip in 2–4 weeks around performance spikes. Long-term holders average 3–6 months waiting for a full season story to develop.</p>
              </div>
            </div>
          </div>
        )}

        {/* ANALYSTS TAB */}
        {tab === "analysts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnalystPanel />
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Rating guide</h3>
                <div className="space-y-2">
                  {[
                    { r: "STRONG BUY",  color: "bg-green-100 text-green-700 border-green-200",   desc: "High conviction, buy immediately" },
                    { r: "BUY",         color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Good entry, favorable risk/reward" },
                    { r: "HOLD",        color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Keep if you own, don't add" },
                    { r: "SELL",        color: "bg-orange-100 text-orange-700 border-orange-200", desc: "Reduce position, take profits" },
                    { r: "STRONG SELL", color: "bg-red-100 text-red-700 border-red-200",          desc: "Exit immediately" },
                  ].map((s) => (
                    <div key={s.r} className="flex items-center gap-3">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full border shrink-0 ${s.color}`}>{s.r}</span>
                      <span className="text-gray-500 text-xs">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

