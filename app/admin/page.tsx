// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";

type Stats = {
  totalListings:  number;
  soldListings:   number;
  totalOrders:    number;
  openOrders:     number;
  totalTrades:    number;
  totalAlerts:    number;
  activeAlerts:   number;
};

export default function AdminDashboard() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [trades,   setTrades]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"overview" | "listings" | "trades">("overview");

  useEffect(() => {
    // Check admin auth
    supabase.auth.getUser().then(({ data }) => {
      const adminEmail = "anna.chapko.2004@gmail.com";
      if (!data.user || data.user.email !== adminEmail) {
        router.push("/app");
        return;
      }
      const headers = { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" };
      Promise.all([
        fetch("/api/admin/stats",    { headers }).then(r => r.json()),
        fetch("/api/admin/listings", { headers }).then(r => r.json()),
        fetch("/api/admin/trades",   { headers }).then(r => r.json()),
      ]).then(([s, l, t]) => {
        setStats(s.stats);
        setListings(l.listings ?? []);
        setTrades(t.trades ?? []);
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Card Tracker platform monitor</p>
          </div>
          <a href="/" className="text-gray-400 hover:text-white text-sm transition">
            ← Back to app
          </a>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Listings",  value: stats.totalListings,  color: "text-blue-400"   },
              { label: "Sold",            value: stats.soldListings,   color: "text-green-400"  },
              { label: "Total Orders",    value: stats.totalOrders,    color: "text-purple-400" },
              { label: "Open Orders",     value: stats.openOrders,     color: "text-yellow-400" },
              { label: "Total Trades",    value: stats.totalTrades,    color: "text-green-400"  },
              { label: "Total Alerts",    value: stats.totalAlerts,    color: "text-blue-400"   },
              { label: "Active Alerts",   value: stats.activeAlerts,   color: "text-orange-400" },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <p className="text-gray-500 text-xs mb-2">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {(["overview", "listings", "trades"] as const).map(t => (
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

        {/* Listings */}
        {tab === "listings" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold">All Listings</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {listings.map((l: any) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{l.playerName}</p>
                    <p className="text-gray-500 text-xs">{l.cardName} · {l.grade}</p>
                    <p className="text-gray-600 text-xs font-mono">{l.sellerWallet?.slice(0, 10)}...</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black">${l.priceUSD}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      l.sold
                        ? "bg-gray-800 text-gray-400"
                        : "bg-green-900 text-green-400"
                    }`}>
                      {l.sold ? "SOLD" : "ACTIVE"}
                    </span>
                  </div>
                </div>
              ))}
              {listings.length === 0 && (
                <div className="p-10 text-center text-gray-500 text-sm">No listings yet</div>
              )}
            </div>
          </div>
        )}

        {/* Trades */}
        {tab === "trades" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold">Recent Trades</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {trades.map((t: any) => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{t.cardId}</p>
                    <p className="text-gray-500 text-xs">
                      {t.buyWallet?.slice(0, 8)}... → {t.sellWallet?.slice(0, 8)}...
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(t.executedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black">${t.price}</p>
                    <p className="text-gray-500 text-xs">{t.shares} shares</p>
                  </div>
                </div>
              ))}
              {trades.length === 0 && (
                <div className="p-10 text-center text-gray-500 text-sm">No trades yet</div>
              )}
            </div>
          </div>
        )}

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h3 className="font-bold mb-4">Platform health</h3>
              <div className="space-y-3">
                {[
                  { label: "MLB Stats API",  status: "Live",    color: "bg-green-500"  },
                  { label: "ESPN News",      status: "Live",    color: "bg-green-500"  },
                  { label: "Supabase DB",    status: "Live",    color: "bg-green-500"  },
                  { label: "eBay Prices",    status: "Mock",    color: "bg-yellow-500" },
                  { label: "ENS Resolution", status: "Live",    color: "bg-green-500"  },
                  { label: "USDC / Base",    status: "Live",    color: "bg-green-500"  },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.color} animate-pulse`} />
                      <span className="text-xs font-semibold text-gray-300">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h3 className="font-bold mb-4">Quick actions</h3>
              <div className="space-y-2">
                {[
                  { label: "View all listings", href: "/api/admin/listings" },
                  { label: "View all trades",   href: "/api/admin/trades"   },
                  { label: "View all alerts",   href: "/api/admin/alerts"   },
                  { label: "View all orders",   href: "/api/admin/orders"   },
                ].map(a => (
                  <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer"
                    className="block w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition text-gray-300">
                    {a.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}