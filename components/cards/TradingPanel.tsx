// ─── components/cards/TradingPanel.tsx ───────────────────────────────────────
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext }                 from "@dynamic-labs/sdk-react-core";
import type { CardToken, Candle }            from "@/lib/cardToken";
import type { OrderBookSnapshot, Order, Trade } from "@/lib/orderbook";

type Props = { token: CardToken };

type Tab = "chart" | "book" | "orders";

export default function TradingPanel({ token }: Props) {
  const { primaryWallet, user }     = useDynamicContext();
  const [tab,        setTab]        = useState<Tab>("chart");
  const [orderType,  setOrderType]  = useState<"BUY" | "SELL">("BUY");
  const [price,      setPrice]      = useState(String(token.pricePerShare));
  const [shares,     setShares]     = useState("1");
  const [book,       setBook]       = useState<OrderBookSnapshot | null>(null);
  const [trades,     setTrades]     = useState<Trade[]>([]);
  const [candles,    setCandles]    = useState<Candle[]>([]);
  const [myOrders,   setMyOrders]   = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");

  const load = useCallback(async () => {
    const res  = await fetch(`/api/cards/orderbook?cardId=${token.id}`);
    const data = await res.json();
    setBook(data.book);
    setTrades(data.trades ?? []);
    setCandles(data.candles ?? []);
  }, [token.id]);

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, [load]);

  const handleOrder = async () => {
    if (!user || !primaryWallet) { setError("Connect wallet first"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/cards/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place", cardId: token.id, type: orderType,
          price: parseFloat(price), shares: parseInt(shares),
          wallet: primaryWallet.address,
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(`${orderType} order placed — ${shares} shares @ $${price}`);
      load();
    } catch { setError("Order failed — try again"); }
    finally { setLoading(false); }
  };

  const total = Math.round(parseFloat(price || "0") * parseInt(shares || "0") * 100) / 100;

  // ── Candlestick SVG ──────────────────────────────────────────────────────────
  const CandleChart = () => {
    if (candles.length === 0) return <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />;
    const W = 500, H = 140, PAD = { l: 40, r: 8, t: 8, b: 20 };
    const prices = candles.flatMap(c => [c.high, c.low]);
    const min    = Math.min(...prices) * 0.995;
    const max    = Math.max(...prices) * 1.005;
    const range  = max - min;
    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;
    const toX    = (i: number) => PAD.l + (i / (candles.length - 1)) * chartW;
    const toY    = (v: number) => PAD.t + chartH - ((v - min) / range) * chartH;
    const barW   = Math.max(2, (chartW / candles.length) * 0.6);

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={PAD.l} x2={W - PAD.r}
            y1={PAD.t + chartH * (1 - f)} y2={PAD.t + chartH * (1 - f)}
            stroke="#f0f0f0" strokeWidth="1" />
        ))}
        {/* Price labels */}
        {[0, 0.5, 1].map(f => (
          <text key={f} x={PAD.l - 4} y={PAD.t + chartH * (1 - f) + 4}
            fontSize="8" fill="#9ca3af" textAnchor="end">
            ${(min + range * f).toFixed(2)}
          </text>
        ))}
        {/* Candles */}
        {candles.map((c, i) => {
          const isUp   = c.close >= c.open;
          const color  = isUp ? "#22c55e" : "#ef4444";
          const bodyY  = toY(Math.max(c.open, c.close));
          const bodyH  = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
          return (
            <g key={i}>
              <line x1={toX(i)} x2={toX(i)} y1={toY(c.high)} y2={toY(c.low)}
                stroke={color} strokeWidth="1" />
              <rect x={toX(i) - barW / 2} y={bodyY} width={barW} height={bodyH}
                fill={color} rx="0.5" />
            </g>
          );
        })}
        {/* Date labels */}
        {[0, Math.floor(candles.length / 2), candles.length - 1].map(i => (
          <text key={i} x={toX(i)} y={H - 4} fontSize="7" fill="#9ca3af" textAnchor="middle">
            {candles[i]?.time.slice(5)}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 text-white">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${token.cardColor}22, transparent)` }}>
        <div className="flex items-center gap-3">
          <img src={token.cardImage} alt={token.playerName}
            className="w-10 h-10 rounded-full object-cover bg-gray-800" />
          <div>
            <p className="font-black text-base">{token.playerName}</p>
            <p className="text-gray-400 text-xs">{token.cardName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black">${token.pricePerShare.toFixed(2)}</p>
          <p className={`text-xs font-bold ${token.changePct24h >= 0 ? "text-green-400" : "text-red-400"}`}>
            {token.changePct24h >= 0 ? "+" : ""}{token.changePct24h}% today
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 divide-x divide-gray-800 border-b border-gray-800">
        {[
          { label: "Bid",    value: book?.bids[0]?.price ? `$${book.bids[0].price}` : "—" },
          { label: "Ask",    value: book?.asks[0]?.price ? `$${book.asks[0].price}` : "—" },
          { label: "Spread", value: book?.spread ? `$${book.spread}` : "—" },
          { label: "Vol",    value: token.volume24h.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="px-3 py-2 text-center">
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="text-white font-bold text-sm">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5">

        {/* Left: Chart + Book */}
        <div className="col-span-3 border-r border-gray-800">

          {/* Sub-tabs */}
          <div className="flex border-b border-gray-800">
            {(["chart", "book", "orders"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                  tab === t ? "text-white border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-300"
                }`}>
                {t === "chart" ? "📊 Chart" : t === "book" ? "📋 Order Book" : "📝 My Orders"}
              </button>
            ))}
          </div>

          {/* Chart */}
          {tab === "chart" && (
            <div className="p-4">
              <CandleChart />
              <div className="mt-4 space-y-1">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Recent trades</p>
                {trades.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-400">{new Date(t.executedAt).toLocaleTimeString()}</span>
                    <span className="text-white font-mono">${t.price.toFixed(2)}</span>
                    <span className="text-gray-400">{t.shares} shares</span>
                  </div>
                ))}
                {trades.length === 0 && <p className="text-gray-600 text-xs">No trades yet — be the first</p>}
              </div>
            </div>
          )}

          {/* Order Book */}
          {tab === "book" && (
            <div className="p-4">
              {/* Asks — sell orders */}
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Asks (Sell orders)</p>
              <div className="space-y-0.5 mb-3">
                {(book?.asks ?? []).slice(0, 6).reverse().map((ask, i) => (
                  <div key={i} className="relative flex justify-between text-xs py-0.5 px-2 rounded overflow-hidden">
                    <div className="absolute inset-y-0 right-0 bg-red-950/40 rounded"
                      style={{ width: `${Math.min(100, (ask.total / 50) * 100)}%` }} />
                    <span className="relative text-red-400 font-mono font-bold">${ask.price.toFixed(2)}</span>
                    <span className="relative text-gray-400">{ask.shares}</span>
                    <span className="relative text-gray-600">{ask.total}</span>
                  </div>
                ))}
              </div>

              {/* Spread */}
              <div className="text-center py-1 border-y border-gray-800 mb-3">
                <span className="text-gray-500 text-xs">
                  Spread: <span className="text-white font-bold">${book?.spread ?? "—"}</span>
                  {" · "}Mid: <span className="text-white font-bold">${book?.midpoint ?? "—"}</span>
                </span>
              </div>

              {/* Bids — buy orders */}
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Bids (Buy orders)</p>
              <div className="space-y-0.5">
                {(book?.bids ?? []).slice(0, 6).map((bid, i) => (
                  <div key={i} className="relative flex justify-between text-xs py-0.5 px-2 rounded overflow-hidden">
                    <div className="absolute inset-y-0 right-0 bg-green-950/40 rounded"
                      style={{ width: `${Math.min(100, (bid.total / 50) * 100)}%` }} />
                    <span className="relative text-green-400 font-mono font-bold">${bid.price.toFixed(2)}</span>
                    <span className="relative text-gray-400">{bid.shares}</span>
                    <span className="relative text-gray-600">{bid.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Orders */}
          {tab === "orders" && (
            <div className="p-4">
              {myOrders.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-8">No open orders</p>
              ) : (
                <div className="space-y-2">
                  {myOrders.map((o) => (
                    <div key={o.id} className="bg-gray-900 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${
                          o.type === "BUY" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                        }`}>{o.type}</span>
                        <p className="text-white text-sm font-bold mt-1">{o.shares} shares @ ${o.price}</p>
                        <p className="text-gray-500 text-xs">{o.status} · {o.filled}/{o.shares} filled</p>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("/api/cards/trade", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "cancel", cardId: token.id, orderId: o.id, wallet: primaryWallet?.address }),
                          });
                          load();
                        }}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Place order */}
        <div className="col-span-2 p-4 space-y-3">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Place Order</p>

          {/* BUY / SELL toggle */}
          <div className="grid grid-cols-2 gap-1 bg-gray-900 rounded-xl p-1">
            {(["BUY", "SELL"] as const).map(t => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`py-2 rounded-lg text-sm font-black transition ${
                  orderType === t
                    ? t === "BUY" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Price */}
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Limit Price ($)</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>

          {/* Shares */}
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Shares</label>
            <input type="number" min="1" max="100" value={shares} onChange={e => setShares(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            <div className="flex gap-1 mt-1">
              {[1, 5, 10, 25].map(n => (
                <button key={n} onClick={() => setShares(String(n))}
                  className="flex-1 py-1 rounded-lg bg-gray-800 text-gray-400 text-xs hover:bg-gray-700 transition">
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-900 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Shares</span>
              <span className="text-white">{shares}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price/share</span>
              <span className="text-white">${price}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-1 mt-1">
              <span className="text-gray-400 font-semibold">Total USDC</span>
              <span className="text-white font-black">${total}</span>
            </div>
          </div>

          {error   && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <button onClick={handleOrder} disabled={loading || !user}
            className={`w-full py-3 rounded-xl font-black text-sm transition disabled:opacity-50 ${
              orderType === "BUY"
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-red-600 hover:bg-red-500 text-white"
            }`}>
            {loading ? "Placing..." : !user ? "Connect wallet" : `Place ${orderType} Order`}
          </button>

          {/* PSA Vault info */}
          <div className="border border-gray-800 rounded-xl p-3 space-y-1">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Vault</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">PSA Cert</span>
              <span className="text-blue-400 font-mono">{token.psaCert}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Status</span>
              <span className="text-green-400 font-bold">✓ {token.vaultStatus}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Shares</span>
              <span className="text-white">{token.totalShares} total</span>
            </div>
            <button className="w-full mt-2 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:border-gray-500 hover:text-gray-300 transition">
              🏦 Request Redemption
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}