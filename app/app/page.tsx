"use client";

import { useState, useEffect, useRef } from "react";
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
import SearchPlayers              from "@/components/cards/SearchPlayers";
import PriceAlerts                from "@/components/cards/PriceAlerts";
import AIAssistant                from "@/components/cards/AIAssistant";
import AuthGate                   from "@/components/AuthGate";
import { DynamicWidget }          from "@dynamic-labs/sdk-react-core";
import { useAuth }                from "@/lib/auth-context";

type Tab = "cards" | "trade" | "portfolio" | "marketplace" | "traders" | "analysts" | "alerts" | "ai";

function ProfileModal({ email, onClose }: {
  email: string | null;
  onClose: () => void;
}) {
  const initial     = email ? email[0].toUpperCase() : "?";
  const defaultName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  const defaultUser = email ? email.split("@")[0] : "";

  const [name,    setName]    = useState(defaultName);
  const [username, setUsername] = useState(defaultUser);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-bold text-gray-900">Edit profile</h2>
        </div>

        {/* Avatar */}
        <div className="flex justify-center py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black ring-4 ring-blue-500"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
              {initial}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-4 space-y-3">
          <div className="border border-gray-200 rounded-xl px-4 py-3">
            <label className="text-xs text-gray-400 block mb-1">Display name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm text-gray-900 focus:outline-none"
            />
          </div>
          <div className="border border-gray-200 rounded-xl px-4 py-3">
            <label className="text-xs text-gray-400 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full text-sm text-gray-900 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Your profile helps people recognize you.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileDropdown({ email, wallet, signOut }: {
  email:   string | null;
  wallet:  string | null;
  signOut: () => Promise<void>;
}) {
  const [open,         setOpen]         = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false); // ← add this
  const ref = useRef<HTMLDivElement>(null);
  // ... rest stays the same

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAccounts(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = email ? email[0].toUpperCase() : wallet ? wallet.slice(2, 4).toUpperCase() : "?";
  const name    = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Wallet User";
  const display = email ?? (wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v => !v); setShowAccounts(false); }}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black hover:opacity-90 transition"
        style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-visible z-50">

          {/* Account row — hover to show switcher */}
          <div
            onMouseEnter={() => setShowAccounts(true)}
            onMouseLeave={() => setShowAccounts(false)}
            className="relative px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                {initial}
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">{name}</p>
                <p className="text-gray-400 text-xs">{display}</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>

            {/* Account switcher panel — floats to the left on hover */}
            {showAccounts && (
              <div
                onMouseEnter={() => setShowAccounts(true)}
                onMouseLeave={() => setShowAccounts(false)}
                className="absolute left-full top-0 ml-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-gray-400 text-xs truncate">{display}</p>
                </div>
                <div className="py-1.5">
                  <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                        {initial}
                      </div>
                      <p className="text-gray-900 text-sm font-medium">{name}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="border-t border-gray-100 py-1.5">
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    Add account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <button onClick={() => { setOpen(false); setShowProfile(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button onClick={() => { setOpen(false); window.location.href = "/app/settings"; }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button onClick={() => { setOpen(false); window.location.href = "/app/settings"; }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </button>
          </div>

          {/* Log out */}
          <div className="border-t border-gray-100 py-1.5">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
            >
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
      {showProfile && (
        <ProfileModal email={email} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

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
  const { isAuthenticated, wallet, email, signOut } = useAuth();

  useEffect(() => {
    fetch("/api/cards/players")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.players ?? []);
        setPlayers(list);
      })
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
    { id: "alerts",      label: "Alerts",        icon: "🔔" },
    { id: "ai",          label: "AI Assistant",  icon: "🤖" },
  ];

  const tabColor = (id: Tab, active: boolean) => {
    if (!active) return "text-gray-500 hover:bg-gray-100";
    if (id === "marketplace") return "bg-purple-600 text-white shadow-sm";
    if (id === "trade")       return "bg-gray-950 text-white shadow-sm";
    if (id === "portfolio")   return "bg-gray-800 text-white shadow-sm";
    if (id === "alerts")      return "bg-orange-500 text-white shadow-sm";
    if (id === "ai")          return "bg-blue-700 text-white shadow-sm";
    return "bg-blue-600 text-white shadow-sm";
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{
        background: "linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #d97706)"
      }} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-3xl md:text-4xl">⚾</span>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Card Tracker</h1>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden md:block">
                Real MLB data · eBay prices · AI signals · Crypto payments
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <ProfileDropdown email={email} wallet={wallet} signOut={signOut} />
            )}

            {!isAuthenticated && <DynamicWidget />}

            {!isAuthenticated && (
              <a
                href="/login"
                className="text-gray-400 hover:text-gray-600 text-xs px-3 py-1.5 rounded-lg border border-gray-200 transition hidden md:block"
              >
                Email / Google
              </a>
            )}
          </div>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap shrink-0 ${tabColor(t.id, tab === t.id)}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">

        {/* ── CARDS TAB — public ─────────────────────────────────────────────── */}
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
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onTrade={(p) => { setTradePlayer(p); setTab("trade"); }}
                    />
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
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-3">🤖 AI Assistant</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Ask the AI about card signals, trading strategies, and market trends.
                </p>
                <button
                  onClick={() => setTab("ai")}
                  className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-600 transition"
                >
                  🤖 Open AI Assistant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TRADE TAB — auth required ──────────────────────────────────────── */}
        {tab === "trade" && (
          <AuthGate>
            <div className="space-y-4">
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
          </AuthGate>
        )}

        {/* ── PORTFOLIO TAB — auth required ──────────────────────────────────── */}
        {tab === "portfolio" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AuthGate>
                <Portfolio />
              </AuthGate>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">How trading works</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Go to Trade tab, pick a player"            },
                    { step: "2", text: "Place a limit BUY order at your price"     },
                    { step: "3", text: "Order fills when a seller matches"         },
                    { step: "4", text: "Your shares appear here in Portfolio"      },
                    { step: "5", text: "Sell anytime with a limit SELL order"      },
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
                  Own 100% of a card&apos;s shares? Redeem to receive the physical PSA-graded card shipped to you.
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Min shares to redeem", value: "100%"              },
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

        {/* ── MARKETPLACE TAB — view public, list requires auth ──────────────── */}
        {tab === "marketplace" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Marketplace />
            </div>
            <div className="space-y-4">
              <AuthGate>
                <ListCardForm onSuccess={() => {}} />
              </AuthGate>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">How buying works</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Click Buy Now on any card"        },
                    { step: "2", text: "Connect your Coinbase Wallet"     },
                    { step: "3", text: "Confirm the USDC payment on Base" },
                    { step: "4", text: "Transaction confirms in seconds"  },
                    { step: "5", text: "Seller ships the card to you"     },
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
                    { label: "Network", value: "Base by Coinbase"  },
                    { label: "Gas fee", value: "~$0.01 per tx"     },
                    { label: "Speed",   value: "~2 seconds"        },
                    { label: "Wallet",  value: "Coinbase Wallet"   },
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

        {/* ── TRADERS TAB — public ───────────────────────────────────────────── */}
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

        {/* ── ANALYSTS TAB — public ──────────────────────────────────────────── */}
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
                    { r: "STRONG BUY",  color: "bg-green-100 text-green-700 border-green-200",      desc: "High conviction, buy immediately"  },
                    { r: "BUY",         color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Good entry, favorable risk/reward"  },
                    { r: "HOLD",        color: "bg-yellow-100 text-yellow-700 border-yellow-200",   desc: "Keep if you own, do not add"        },
                    { r: "SELL",        color: "bg-orange-100 text-orange-700 border-orange-200",   desc: "Reduce position, take profits"      },
                    { r: "STRONG SELL", color: "bg-red-100 text-red-700 border-red-200",            desc: "Exit immediately"                   },
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

        {/* ── ALERTS TAB — auth required ─────────────────────────────────────── */}
        {tab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AuthGate>
                <PriceAlerts players={players} />
              </AuthGate>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">About alerts</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">
                  Set a target price for any card share. We check prices every 5 minutes and notify you the moment your target is hit.
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "In-app",  value: "Always on"   },
                    { label: "Email",   value: "Optional"    },
                    { label: "Checks",  value: "Every 5 min" },
                    { label: "Cost",    value: "Free"        },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="text-gray-700 font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">Email alerts</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Add your email when creating an alert to get notified instantly. No spam — one email per trigger.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">Price alert ideas</h3>
                <div className="space-y-2 text-xs text-gray-500">
                  {[
                    "📈 Alert above $5 — take profits on a BUY",
                    "📉 Alert below $2 — buy the dip",
                    "🎯 Alert above analyst target price",
                    "⚡ Alert on HR day price spike",
                  ].map((tip, i) => (
                    <p key={i}>{tip}</p>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setTab("trade")}
                className="w-full py-2.5 rounded-xl bg-gray-950 text-white font-bold text-sm hover:bg-gray-800 transition"
              >
                📊 Go to Trade
              </button>
            </div>
          </div>
        )}

        {/* ── AI ASSISTANT TAB — auth required ───────────────────────────────── */}
        {tab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AuthGate>
                <AIAssistant players={players} />
              </AuthGate>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">What can I ask?</h3>
                <div className="space-y-2 text-sm text-gray-500">
                  {[
                    "💡 Which cards have strong BUY signals?",
                    "📊 How does the order book work?",
                    "🏦 How do I redeem a physical card?",
                    "📈 What makes card prices go up?",
                    "⚡ How fast do trades settle?",
                    "🔔 How do price alerts work?",
                  ].map((q, i) => (
                    <p key={i}>{q}</p>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">About the AI</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Powered by Claude. Knows your platform, tracked players, and card market dynamics. Not financial advice — trading education.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-2">Player profiles</h3>
                <p className="text-gray-500 text-sm mb-3">
                  View deep stats, sales history, and analyst calls for any player.
                </p>
                <div className="space-y-2">
                  {players.slice(0, 5).map(p => (
                    <a key={p.id} href={`/players/${p.id}`}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition group">
                      <img src={p.cardImage} alt={p.name}
                        className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition font-medium truncate">
                        {p.name}
                      </span>
                      <span className="ml-auto text-gray-300 text-xs">→</span>
                    </a>
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