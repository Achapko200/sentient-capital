// ─── components/cards/Portfolio.tsx ──────────────────────────────────────────
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext }                 from "@dynamic-labs/sdk-react-core";

type Position = {
  cardId:        string;
  playerName:    string;
  cardName:      string;
  shares:        number;
  avgCost:       number;
  currentPrice:  number;
  unrealizedPnl: number;
  pnlPct:        number;
  cardImage:     string;
};

type AmmQuote = {
  price:       number;
  sellReturn:  number;
  impact:      number;
};

function SellToMarket({
  pos,
  wallet,
  onSold,
}: {
  pos:    Position;
  wallet: string;
  onSold: () => void;
}) {
  const [open,      setOpen]      = useState(false);
  const [shares,    setShares]    = useState(1);
  const [quote,     setQuote]     = useState<AmmQuote | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [success,   setSuccess]   = useState("");
  const [error,     setError]     = useState("");

  // Fetch quote whenever shares changes
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetch(`/api/cards/amm?cardId=${pos.cardId}&shares=${shares}&side=sell`)
      .then(r => r.json())
      .then(setQuote)
      .catch(() => setQuote(null))
      .finally(() => setFetching(false));
  }, [pos.cardId, shares, open]);

  const handleSell = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cards/amm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action: "sell",
          cardId: pos.cardId,
          wallet,
          shares,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sale failed");
      setSuccess(`Sold ${shares} shares — received $${data.usdcReceived} USDC`);
      setTimeout(() => { setSuccess(""); setOpen(false); onSold(); }, 2000);
    } catch (err: any) {
      setError(err.message ?? "Sale failed — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition font-semibold"
        >
          ⚡ Sell to Market
        </button>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">Instant sell</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
          </div>

          {/* Shares input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={pos.shares}
              value={shares}
              onChange={e => setShares(Math.min(pos.shares, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400"
            />
            <span className="text-gray-400 text-xs">of {pos.shares} shares</span>
            <button
              onClick={() => setShares(pos.shares)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Max
            </button>
          </div>

          {/* Quote */}
          {fetching ? (
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ) : quote && (
            <div className="bg-white rounded-lg p-2 border border-gray-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Market price</span>
                <span className="font-semibold">${quote.price}/share</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">You receive</span>
                <span className="font-black text-green-600">${quote.sellReturn} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price impact</span>
                <span className={Math.abs(quote.impact) > 5 ? "text-red-500 font-semibold" : "text-gray-400"}>
                  {quote.impact > 0 ? "+" : ""}{quote.impact}%
                </span>
              </div>
            </div>
          )}

          {success && <p className="text-green-600 text-xs font-semibold">{success}</p>}
          {error   && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={handleSell}
            disabled={loading || !quote}
            className="w-full py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-500 transition disabled:opacity-50"
          >
            {loading ? "Selling..." : `Sell ${shares} shares instantly`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Portfolio() {
  const { primaryWallet, user } = useDynamicContext();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!primaryWallet?.address) { setLoading(false); return; }
    fetch(`/api/cards/portfolio?wallet=${primaryWallet.address}`)
      .then(r => r.json())
      .then(d => setPositions(d.positions ?? []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, [primaryWallet?.address]);

  useEffect(() => { load(); }, [load]);

  const totalValue  = positions.reduce((s, p) => s + p.currentPrice * p.shares, 0);
  const totalCost   = positions.reduce((s, p) => s + p.avgCost * p.shares, 0);
  const totalPnl    = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? Math.round((totalPnl / totalCost) * 1000) / 10 : 0;

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <p className="text-4xl mb-3">💼</p>
        <p className="text-gray-700 font-bold">Connect your wallet to see your portfolio</p>
        <p className="text-gray-400 text-sm mt-1">Your card positions and P&L will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Summary bar */}
      <div className="bg-gray-950 rounded-2xl p-5 text-white grid grid-cols-3 gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Portfolio Value</p>
          <p className="text-2xl font-black mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Total Cost</p>
          <p className="text-2xl font-black mt-1">${totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Unrealized P&L</p>
          <p className={`text-2xl font-black mt-1 ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            <span className="text-sm ml-1">({totalPnlPct}%)</span>
          </p>
        </div>
      </div>

      {/* Positions */}
      {positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No positions yet — go to the Trade tab to buy card shares</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-gray-900 font-black">Open Positions</h3>
            <p className="text-gray-400 text-xs">{positions.length} position{positions.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {positions.map((pos) => (
              <div key={pos.cardId} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <img src={pos.cardImage} alt={pos.playerName}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm">{pos.playerName}</p>
                    <p className="text-gray-400 text-xs">{pos.cardName}</p>
                    <p className="text-gray-400 text-xs">{pos.shares} shares · avg ${pos.avgCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-900 font-black">${(pos.currentPrice * pos.shares).toFixed(2)}</p>
                    <p className={`text-xs font-bold ${pos.unrealizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)} ({pos.pnlPct}%)
                    </p>
                    <a href={`/players/${pos.cardId}`}
                      className="text-xs text-blue-500 hover:text-blue-600 transition">
                      View profile →
                    </a>
                  </div>
                </div>

                {/* Sell to market */}
                {primaryWallet?.address && (
                  <SellToMarket
                    pos={pos}
                    wallet={primaryWallet.address}
                    onSold={load}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}