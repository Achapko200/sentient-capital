"use client";

import { useState, useEffect }   from "react";
import type { Player }            from "@/lib/cardTypes";
import type { CardToken }         from "@/lib/cardToken";
import PlayerCard                 from "@/components/cards/PlayerCard";
import NewsTickerCard             from "@/components/cards/NewsTickerCard";
import TraderLeaderboard          from "@/components/cards/TraderLeaderboard";
import AnalystPanel               from "@/components/cards/AnalystPanel";
import Marketplace                from "@/components/cards/Marketplace";
import ListCardForm               from "@/components/cards/ListCardForm";
import TradingPanel               from "@/components/cards/TradingPanel";
import Portfolio                  from "@/components/cards/Portfolio";
import SearchPlayers              from "@/components/cards/Searchplayers";

type Tab = "cards" | "trade" | "portfolio" | "marketplace" | "traders" | "analysts";

// ─── Loads token data then renders TradingPanel ───────────────────────────────
function TradingPanelLoader({ player }: { player: Player }) {
  const [token, setToken] = useState<CardToken | null>(null);

  useEffect(() => {
    fetch(`/api/cards/orderbook?cardId=${player.id}`)
      .then(r => r.json())
      .then(d => setToken(d.token))
      .catch(() => {});
  }, [player.id]);

  if (!token) return <div className="h-96 bg-gray-900 rounded-2xl animate-pulse" />;
  return <TradingPanel token={token} />;
}

export default function Home() {
  const [tab,         setTab]         = useState<Tab>("cards");
  const [players,     setPlayers]     = useState<Player[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tradePlayer, setTradePlayer] = useState<Player | null>(null);

  useEffect(() => {
    fetch("/api/cards/players")
      .then((r) => r.json())
      .then((data: Player[]) => setPlayers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "cards",       label: "Card Tracker",  icon: "⚾" },
    { id: "trade",       label: "Trade",         icon: "📊" },
    { id: "portfolio",   label: "Portfolio",     icon: "💼" },
    { id: "marketplace", label: "Buy Cards",     icon: "🛒" },
    { id: "traders",     label: "Trader Gains",  icon: "📈" },
    { id: "analysts",    label: "Analyst Picks", icon: "🎓" },
  ];

  const tabColor = (id: Tab, active: boolean) => {
    if (!active) return "text-gray-500 hover:bg-gray-100";
    if (id === "marketplace") return "bg-purple-600 text-white shadow-sm";
    if (id === "trade")       return "bg-gray-950 text-white shadow-sm";
    if (id === "portfolio")   return "bg-gray-800 text-white shadow-sm";
    return "bg-blue-600 text-white shadow-sm";
  };

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
          <div className="flex gap-2 flex-wrap justify-end">
            {[
              { label: "MLB Live",    color: "bg-green-100 text-green-700 border-green-200"    },
              { label: "ESPN Live",   color: "bg-green-100 text-green-700 border-green-200"    },
              { label: "eBay Mock",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { label: "USDC · Base", color: "bg-purple-100 text-purple-700 border-purple-200" },
              { label: "Order Book",  color: "bg-gray-100 text-gray-700 border-gray-200"       },
            ].map((s) => (
              <span key={s.label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition ${tabColor(t.id, tab === t.id)}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* ── CARDS TAB ──────────────────────────────────────────────────────── */}
        {tab === "cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-48" />
                  ))}
                </div>
              ) : players.length === 0 ? (
                <div className="rounded-xl bg-white border border-gray-200 p-10 text-center">
                  <p className="text-gray-400 text-sm">No players found — check your MLB API connection.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <NewsTickerCard />
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-4">How signals work</h3>
                <div className="space-y-4">
                  {[
                    { signal: "BUY",  color: "bg-green-100 text-green-700 border-green-200",    desc: "Strong performance + price hasn't moved yet. Early window before collectors pile in." },
                    { signal: "HOLD", color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Mixed signals or price already reflects performance. Wait for a clearer window."      },
                    { signal: "SELL", color: "bg-red-100 text-red-700 border-red-200",           desc: "Slump or price elevated vs. performance. Sell into current demand now."               },
                  ].map((s) => (
                    <div key={s.signal} className="flex gap-3 items-start">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg border shrink-0 ${s.color}`}>{s.signal}</span>
                      <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-3">Trade like a stock</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Go to the 📊 Trade tab to buy and sell card shares with limit orders — just like stocks.
                </p>
                <button
                  onClick={() => setTab("trade")}
                  className="w-full py-2.5 rounded-xl bg-gray-950 text-white font-bold text-sm hover:bg-gray-800 transition"
                >
                  📊 Open Trading
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TRADE TAB ──────────────────────────────────────────────────────── */}
        {tab === "trade" && (
          <div className="space-y-4">

            {/* Search bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchPlayers onSelect={(p) => setTradePlayer(p)} />
              </div>
              {tradePlayer && (
                <button
                  onClick={() => setTradePlayer(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white transition"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {tradePlayer ? (
              <TradingPanelLoader player={tradePlayer} />
            ) : (
              <>
                <p className="text-gray-500 text-sm">Select a player above or pick from the watchlist:</p>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {players.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setTradePlayer(p)}
                        className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md transition text-left group"
                      >
                        <img
                          src={p.cardImage}
                          alt={p.name}
                          className="w-12 h-12 rounded-full object-cover bg-gray-100 mb-2"
                        />
                        <p className="text-gray-900 font-bold text-sm truncate group-hover:text-blue-600">{p.name}</p>
                        <p className="text-gray-400 text-xs truncate">{p.team}</p>
                        <p className="text-gray-300 text-xs mt-1">📊 Trade shares</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PORTFOLIO TAB ──────────────────────────────────────────────────── */}
        {tab === "portfolio" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Portfolio />
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">How trading works</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Go to Trade tab, pick a player"           },
                    { step: "2", text: "Place a limit BUY order at your price"    },
                    { step: "3", text: "Order fills when a seller matches"        },
                    { step: "4", text: "Your shares appear here in Portfolio"     },
                    { step: "5", text: "Sell anytime with a limit SELL order"     },
                    { step: "6", text: "Redeem shares to receive the physical card" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-3 items-center">
                      <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <p className="text-gray-600 text-sm">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Card redemption</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Own 100% of a card's shares? Redeem to receive the physical PSA-graded card shipped to you.
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Min shares to redeem", value: "100%" },
                    { label: "Processing time",      value: "3–5 business days" },
                    { label: "Shipping",             value: "Insured & tracked" },
                    { label: "Vault partner",        value: "PSA (coming soon)" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="text-gray-700 font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setTab("trade")}
                className="w-full py-3 rounded-xl bg-gray-950 text-white font-bold text-sm hover:bg-gray-800 transition"
              >
                📊 Go to Trade
              </button>
            </div>
          </div>
        )}

        {/* ── MARKETPLACE TAB ────────────────────────────────────────────────── */}
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
                    { step: "1", text: "Click Buy Now on any card"         },
                    { step: "2", text: "Connect your Coinbase Wallet"      },
                    { step: "3", text: "Confirm the USDC payment on Base"  },
                    { step: "4", text: "Transaction confirms in seconds"   },
                    { step: "5", text: "Seller ships the card to you"      },
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
                    { label: "Token",   value: "USDC (stable $1)"  },
                    { label: "Network", value: "Base by Coinbase"   },
                    { label: "Gas fee", value: "~$0.01 per tx"      },
                    { label: "Speed",   value: "~2 seconds"         },
                    { label: "Wallet",  value: "Coinbase Wallet"    },
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

        {/* ── TRADERS TAB ────────────────────────────────────────────────────── */}
        {tab === "traders" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TraderLeaderboard />
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">What is unrealized gain?</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Unrealized gain is profit on cards you still own — the difference between what you paid
                  and what they are worth today. It becomes real when you sell.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Avg hold times</h3>
                <p className="text-gray-500 text-sm">
                  Short-term traders flip in 2–4 weeks around performance spikes. Long-term holders
                  average 3–6 months waiting for a full season story to develop.
                </p>
              </div>
              <button
                onClick={() => setTab("trade")}
                className="w-full py-2.5 rounded-xl bg-gray-950 text-white font-bold text-sm hover:bg-gray-800 transition"
              >
                📊 Start Trading
              </button>
            </div>
          </div>
        )}

        {/* ── ANALYSTS TAB ───────────────────────────────────────────────────── */}
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
                    { r: "STRONG BUY",  color: "bg-green-100 text-green-700 border-green-200",      desc: "High conviction, buy immediately"     },
                    { r: "BUY",         color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Good entry, favorable risk/reward"     },
                    { r: "HOLD",        color: "bg-yellow-100 text-yellow-700 border-yellow-200",   desc: "Keep if you own, do not add"           },
                    { r: "SELL",        color: "bg-orange-100 text-orange-700 border-orange-200",   desc: "Reduce position, take profits"         },
                    { r: "STRONG SELL", color: "bg-red-100 text-red-700 border-red-200",            desc: "Exit immediately"                      },
                  ].map((s) => (
                    <div key={s.r} className="flex items-center gap-3">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full border shrink-0 ${s.color}`}>{s.r}</span>
                      <span className="text-gray-500 text-xs">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">About analyst ratings</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Ratings are generated from live MLB stats — OPS, HR, batting average, and recent game performance. Updated daily as stats change.
                </p>
              </div>
              <button
                onClick={() => setTab("trade")}
                className="w-full py-2.5 rounded-xl bg-gray-950 text-white font-bold text-sm hover:bg-gray-800 transition"
              >
                📊 Trade on this signal
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}