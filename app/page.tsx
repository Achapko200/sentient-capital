"use client";

import { useState }          from "react";
import { WATCHLIST }         from "@/lib/players";
import PlayerCard            from "@/components/cards/PlayerCard";
import NewsTickerCard        from "@/components/cards/NewsTickerCard";
import TraderLeaderboard     from "@/components/cards/TraderLeaderboard";
import AnalystPanel          from "@/components/cards/AnalystPanel";
import Marketplace           from "@/components/cards/Marketplace";
import ListCardForm          from "@/components/cards/ListCardForm";

type Tab = "cards" | "traders" | "analysts" | "marketplace";

export default function Home() {
  const [tab, setTab] = useState<Tab>("cards");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "cards",       label: "Card Tracker",  icon: "⚾" },
    { id: "marketplace", label: "Buy Cards",     icon: "🛒" },
    { id: "traders",     label: "Trader Gains",  icon: "📈" },
    { id: "analysts",    label: "Analyst Picks", icon: "🎓" },
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
              { label: "MLB Live",    color: "bg-green-100 text-green-700 border-green-200" },
              { label: "ESPN Live",   color: "bg-green-100 text-green-700 border-green-200" },
              { label: "eBay Mock",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { label: "USDC · Base", color: "bg-purple-100 text-purple-700 border-purple-200" },
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
                  ? t.id === "marketplace"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-blue-600 text-white shadow-sm"
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
                    { signal: "BUY",  color: "bg-green-100 text-green-700 border-green-200",   desc: "Strong performance + price hasn't moved yet. Early window before collectors pile in." },
                    { signal: "HOLD", color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Mixed signals or price already reflects performance. Wait for a clearer window." },
                    { signal: "SELL", color: "bg-red-100 text-red-700 border-red-200",          desc: "Slump or price elevated vs. performance. Sell into current demand now." },
                  ].map((s) => (
                    <div key={s.signal} className="flex gap-3 items-start">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg border shrink-0 ${s.color}`}>{s.signal}</span>
                      <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-3">Buy with crypto</h3>
                <p className="text-gray-500 text-sm mb-3">Go to the 🛒 Buy Cards tab to purchase cards with USDC on Base network.</p>
                <button
                  onClick={() => setTab("marketplace")}
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition"
                >
                  🛒 Go to Marketplace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MARKETPLACE TAB */}
        {tab === "marketplace" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Marketplace />
            </div>
            <div className="space-y-4">
              <ListCardForm onSuccess={() => window.location.reload()} />
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">How buying works</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Click Buy Now on any card" },
                    { step: "2", text: "Connect your Coinbase Wallet" },
                    { step: "3", text: "Confirm the USDC payment on Base" },
                    { step: "4", text: "Transaction confirms in seconds" },
                    { step: "5", text: "Seller ships the card to you" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-3 items-center">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <p className="text-gray-600 text-sm">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Payment info</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Token",   value: "USDC (stable $1)" },
                    { label: "Network", value: "Base by Coinbase" },
                    { label: "Gas fee", value: "~$0.01 per tx" },
                    { label: "Speed",   value: "~2 seconds" },
                    { label: "Wallet",  value: "Coinbase Wallet" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="text-gray-700 font-semibold">{r.value}</span>
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
                  Unrealized gain is profit on cards you still own — the difference between what you paid and what they are worth today. It becomes real when you sell.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Avg hold times</h3>
                <p className="text-gray-500 text-sm">Short-term traders flip in 2-4 weeks around performance spikes. Long-term holders average 3-6 months waiting for a full season story to develop.</p>
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
                    { r: "STRONG BUY",  color: "bg-green-100 text-green-700 border-green-200",      desc: "High conviction, buy immediately" },
                    { r: "BUY",         color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Good entry, favorable risk/reward" },
                    { r: "HOLD",        color: "bg-yellow-100 text-yellow-700 border-yellow-200",   desc: "Keep if you own, do not add" },
                    { r: "SELL",        color: "bg-orange-100 text-orange-700 border-orange-200",   desc: "Reduce position, take profits" },
                    { r: "STRONG SELL", color: "bg-red-100 text-red-700 border-red-200",            desc: "Exit immediately" },
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