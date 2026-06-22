// ─── components/cards/PriceAlerts.tsx ────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";
import { useDynamicContext }   from "@dynamic-labs/sdk-react-core";
import type { Alert }          from "@/lib/alerts";
import type { Player }         from "@/lib/cardTypes";

export default function PriceAlerts({ players }: { players: Player[] }) {
  const { primaryWallet, user } = useDynamicContext();
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [cardId,    setCardId]    = useState(players[0]?.id ?? "");
  const [direction, setDirection] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [price,     setPrice]     = useState("");
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState("");

  const load = async () => {
    if (!primaryWallet?.address) return;
    const res  = await fetch(`/api/cards/alerts?wallet=${primaryWallet.address}`);
    const data = await res.json();
    setAlerts(data.alerts ?? []);
  };

  useEffect(() => { load(); }, [primaryWallet?.address]);

  const handleCreate = async () => {
    if (!primaryWallet?.address || !price) return;
    setLoading(true);
    const player = players.find(p => p.id === cardId);
    await fetch("/api/cards/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet:      primaryWallet.address,
        cardId,
        playerName:  player?.name ?? cardId,
        targetPrice: parseFloat(price),
        direction,
        email:       email || null,
      }),
    });
    setPrice(""); setSuccess("Alert created!"); load();
    setTimeout(() => setSuccess(""), 3000);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/cards/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, wallet: primaryWallet?.address }),
    });
    load();
  };

  if (!user) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <p className="text-gray-400 text-sm">Connect wallet to set price alerts</p>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Create alert */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-900 font-black mb-4">🔔 Set Price Alert</h3>
        <div className="space-y-3">

          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Player</label>
            <select value={cardId} onChange={e => setCardId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400">
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["ABOVE", "BELOW"] as const).map(d => (
              <button key={d} onClick={() => setDirection(d)}
                className={`py-2 rounded-xl text-sm font-bold border transition ${
                  direction === d
                    ? d === "ABOVE" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>
                {d === "ABOVE" ? "📈 Above" : "📉 Below"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Target Price ($)</label>
            <input type="number" placeholder="e.g. 3.50" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">
              Email (optional — get notified)
            </label>
            <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          {success && <p className="text-green-600 text-xs">{success}</p>}

          <button onClick={handleCreate} disabled={loading || !price}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Creating..." : "Set Alert"}
          </button>
        </div>
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-gray-900 font-black text-sm">Active Alerts</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`text-xs font-black px-2 py-1 rounded-full border ${
                  alert.triggered
                    ? "bg-gray-100 text-gray-400 border-gray-200"
                    : alert.direction === "ABOVE"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                }`}>
                  {alert.triggered ? "✓ HIT" : alert.direction === "ABOVE" ? "↑" : "↓"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-sm truncate">{alert.playerName}</p>
                  <p className="text-gray-400 text-xs">
                    {alert.direction === "ABOVE" ? "Above" : "Below"} ${alert.targetPrice}
                    {alert.email && ` · ${alert.email}`}
                  </p>
                </div>
                {!alert.triggered && (
                  <button onClick={() => handleDelete(alert.id)}
                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}