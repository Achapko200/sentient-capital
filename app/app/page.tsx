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
import CardPurchasePanel           from "@/components/cards/CardPurchasePanel";
import MyCards                     from "@/components/cards/MyCards";
import AuthGate                   from "@/components/AuthGate";
import { DynamicWidget }          from "@dynamic-labs/sdk-react-core";
import { useAuth }                from "@/lib/auth-context";
import { supabase }              from "@/lib/supabase";

type Tab = "cards" | "buy" | "mycards" | "signals" | "alerts" | "ai" | "scan";

function ProfileModal({ email, onClose }: {
  email: string | null;
  onClose: () => void;
}) {
  const initial     = email ? email[0].toUpperCase() : "?";
  const defaultName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  const defaultUser = email ? email.split("@")[0] : "";

  const [name,    setName]    = useState(defaultName);
  const [username, setUsername] = useState(defaultUser);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: name, username } });
      if (error) throw error;
      setSuccess("Profile saved!");
      setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

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
          {error   && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-500 text-xs">{success}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
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
        <div className="absolute right-0 top-11 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-visible z-50">

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
            <a href="/pricing" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Upgrade to Pro
            </a>
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

function UpgradeBanner() {
  const [show, setShow] = useState(true);
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const res = await fetch(`/api/subscription?userId=${data.user.id}`);
      const sub = await res.json();
      setTier(sub.tier ?? "free");
    });
  }, []);

  if (!show || tier !== "free") return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-semibold">⚡ Upgrade to Pro</span>
        <span className="text-blue-200 text-xs hidden md:block">Unlimited alerts, AI messages, card scanner & more</span>
      </div>
      <div className="flex items-center gap-2">
        <a href="/pricing"
          className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-blue-50 transition shrink-0">
          See plans
        </a>
        <button onClick={() => setShow(false)} className="text-blue-200 hover:text-white transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ScanTab() {
  const [tier, setTier] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const res = await fetch(`/api/subscription?userId=${data.user.id}`);
      const sub = await res.json();
      setTier(sub.tier ?? "free");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-40 animate-pulse bg-gray-100 rounded-2xl" />;

  if (tier === "free") {
    return (
      <div className="flex flex-col items-center justify-center py-16 max-w-sm mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl mb-4">📸</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Card Scanner</h2>
        <p className="text-gray-500 text-sm mb-2">AI-powered card grading and valuation</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 w-full">
          <p className="text-amber-700 text-sm font-semibold">🔒 Pro feature</p>
          <p className="text-amber-600 text-xs mt-0.5">Upgrade to Pro to access the card scanner</p>
        </div>
        <a href="/pricing"
          className="px-8 py-3 rounded-xl font-black text-white text-sm transition w-full text-center"
          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
          Upgrade to Pro — $9.99/mo
        </a>
        <p className="text-gray-400 text-xs mt-3">Unlimited alerts · Unlimited AI · Card scanner</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">📸</div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Card Scanner</h2>
      <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
        Take a photo of any baseball card to get an AI-powered grade estimate and valuation
      </p>
      <a href="/scan"
        className="px-8 py-3 rounded-xl font-black text-white text-sm transition"
        style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
        Open Card Scanner
      </a>
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
    { id: "cards",   label: "Market",   icon: "⚾" },
    { id: "buy",     label: "Buy/Sell", icon: "📊" },
    { id: "mycards", label: "My Cards", icon: "💼" },
    { id: "signals", label: "Signals",  icon: "🎓" },
    { id: "alerts",  label: "Alerts",   icon: "🔔" },
    { id: "ai",      label: "AI",       icon: "🤖" },
    { id: "scan",    label: "Scan",     icon: "📸" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gray-950 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚾</span>
            <h1 className="text-lg font-black text-white tracking-tight">Card Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <ProfileDropdown email={email} wallet={wallet} signOut={signOut} />
            )}
            {!isAuthenticated && <DynamicWidget />}
            {!isAuthenticated && (
              <a href="/login"
                className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition">
                Sign in
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — desktop */}
      <div className="bg-gray-900 sticky top-[52px] z-30 hidden md:block">
        <div className="max-w-7xl mx-auto flex overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition whitespace-nowrap shrink-0 border-b-2 ${
                tab === t.id
                  ? "border-red-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs — mobile */}
      <div className="bg-gray-900 md:hidden overflow-x-auto scrollbar-hide">
        <div className="flex px-2 py-2 gap-1.5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                tab === t.id
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Upgrade banner for free users */}
      <UpgradeBanner />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8 pb-24 md:pb-8">

        {/* ── CARDS TAB — public ─────────────────────────────────────────────── */}
        {/* ── MARKET TAB ─────────────────────────────────────────────────── */}
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
                  <p className="text-gray-400 text-sm">No cards available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onTrade={(p) => { setTradePlayer(p); setTab("buy"); }}
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
                    { signal: "HOLD", color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Mixed signals or price already reflects performance. Wait for a clearer window." },
                    { signal: "SELL", color: "bg-red-100 text-red-700 border-red-200",           desc: "Slump or price elevated vs. performance. Sell into current demand now." },
                  ].map((s) => (
                    <div key={s.signal} className="flex gap-3 items-start">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg border shrink-0 ${s.color}`}>{s.signal}</span>
                      <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 font-bold text-base mb-3">🤖 AI Assistant</h3>
                <p className="text-gray-500 text-sm mb-3">Ask the AI about card values, trading strategy, and market trends.</p>
                <button onClick={() => setTab("ai")}
                  className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-600 transition">
                  🤖 Open AI Assistant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BUY/SELL TAB ────────────────────────────────────────────────── */}
        {tab === "buy" && (
          <AuthGate>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchPlayers onSelect={(p) => setTradePlayer(p)} />
                </div>
                {tradePlayer && (
                  <button onClick={() => setTradePlayer(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white transition">
                    ✕ Clear
                  </button>
                )}
              </div>
              {tradePlayer ? (
                <CardPurchasePanel player={tradePlayer} />
              ) : (
                <>
                  <p className="text-gray-500 text-sm">Select a card to buy or sell:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {players.map((p) => (
                      <button key={p.id} onClick={() => setTradePlayer(p)}
                        className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md transition text-left group">
                        <img src={p.cardImage} alt={p.name}
                          className="w-12 h-12 rounded-full object-cover bg-gray-100 mb-2" />
                        <p className="text-gray-900 font-bold text-sm truncate group-hover:text-blue-600">{p.name}</p>
                        <p className="text-gray-400 text-xs truncate">{p.team}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </AuthGate>
        )}

        {/* ── MY CARDS TAB ────────────────────────────────────────────────── */}
        {tab === "mycards" && (
          <AuthGate>
            <MyCards />
          </AuthGate>
        )}

        {/* ── SIGNALS TAB ─────────────────────────────────────────────────── */}
        {tab === "signals" && (
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
            </div>
          </div>
        )}

        {/* ── ALERTS TAB ──────────────────────────────────────────────────── */}
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
                  Set a target price for any card. We check prices every day and notify you when your target is hit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── AI TAB ──────────────────────────────────────────────────────── */}
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
                    "💡 Which cards should I buy right now?",
                    "📊 What is this card worth?",
                    "📈 What makes card prices go up?",
                    "🔔 How do price alerts work?",
                    "⚾ Tell me about this player",
                  ].map((q, i) => <p key={i}>{q}</p>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCAN TAB ────────────────────────────────────────────────────── */}
        {tab === "scan" && (
          <ScanTab />
        )}
      </div>
    </div>
  );
}