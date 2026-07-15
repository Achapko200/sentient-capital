// ─── components/cards/TradingPanel.tsx ───────────────────────────────────────
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext }                 from "@dynamic-labs/sdk-react-core";
import { useAuth }                           from "@/lib/auth-context";
import type { CardToken, Candle }            from "@/lib/cardToken";
import type { OrderBookSnapshot, Order, Trade } from "@/lib/orderbook";

type Props = { token: CardToken };
type Mode  = "buy" | "sell";

export default function TradingPanel({ token }: Props) {
  const { primaryWallet, user }  = useDynamicContext();
  const { email: authEmail }     = useAuth();
  const effectiveWallet = primaryWallet?.address ?? (authEmail ? `email:${authEmail}` : null);

  const [mode,       setMode]       = useState<Mode>("buy");
  const [orderType,  setOrderType]  = useState<"market" | "limit">("market");
  const [price,      setPrice]      = useState(String(token.pricePerShare));
  const [shares,     setShares]     = useState("1");
  const [book,       setBook]       = useState<OrderBookSnapshot | null>(null);
  const [trades,     setTrades]     = useState<Trade[]>([]);
  const [candles,    setCandles]    = useState<Candle[]>([]);
  const [myOrders,   setMyOrders]   = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [ammQuote,   setAmmQuote]   = useState<any>(null);
  const [tab,        setTab]        = useState<"chart" | "book">("chart");

  const currentPrice = book?.lastPrice || token.pricePerShare;
  const total = Math.round(parseFloat(price || "0") * parseInt(shares || "0") * 100) / 100;

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/cards/orderbook?cardId=${token.id}`);
      const data = await res.json();
      setBook(data.book);
      setTrades(data.trades ?? []);
      setCandles(data.candles ?? []);
    } catch {}
  }, [token.id]);

  const loadMyOrders = useCallback(async () => {
    if (!effectiveWallet) return;
    try {
      const res  = await fetch(`/api/cards/orders?cardId=${token.id}&wallet=${effectiveWallet}`);
      const data = await res.json();
      setMyOrders(data.orders ?? []);
    } catch {}
  }, [token.id, effectiveWallet]);

  useEffect(() => {
    load();
    loadMyOrders();
    const i = setInterval(() => { load(); }, 10000);
    return () => clearInterval(i);
  }, [load, loadMyOrders]);

  // Fetch AMM quote for market orders
  useEffect(() => {
    if (orderType !== "market") return;
    const n = parseInt(shares) || 1;
    fetch(`/api/cards/amm?cardId=${token.id}&shares=${n}&side=${mode}`)
      .then(r => r.json())
      .then(setAmmQuote)
      .catch(() => setAmmQuote(null));
  }, [token.id, shares, mode, orderType]);

  const handleCardPayment = async () => {
    if (!effectiveWallet) { setError("Sign in first"); return; }
    setLoading(true); setError("");
    try {
      const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser();
      const res = await fetch("/api/stripe/pay", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          cardId:        token.id,
          playerName:    token.playerName,
          shares:        parseInt(shares),
          pricePerShare: parseFloat(orderType === "market" ? String(ammQuote?.price ?? currentPrice) : price),
          userId:        user?.id ?? effectiveWallet,
          email:         user?.email ?? authEmail,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message ?? "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!effectiveWallet) { setError("Sign in to trade"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (orderType === "market") {
        // Instant AMM trade
        const res = await fetch("/api/cards/amm", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            action:     mode,
            cardId:     token.id,
            wallet:     effectiveWallet,
            shares:     parseInt(shares),
            usdcAmount: mode === "buy" ? parseFloat(price) * parseInt(shares) : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Trade failed");
        const received = mode === "sell" ? `$${data.usdcReceived} USDC` : `${data.sharesReceived} shares`;
        setSuccess(`Order filled! Received ${received}`);
        load();
      } else {
        // Limit order
        const res = await fetch("/api/cards/trade", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            action: "place", cardId: token.id,
            type:   mode.toUpperCase(), price: parseFloat(price),
            shares: parseInt(shares), wallet: effectiveWallet,
          }),
        });
        if (!res.ok) throw new Error();
        setSuccess(`Limit order placed — ${shares} shares @ $${price}`);
        load(); loadMyOrders();
      }
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message ?? "Order failed — try again");
    } finally {
      setLoading(false);
    }
  };

  // Candlestick chart
  const CandleChart = () => {
    if (candles.length === 0) return <div className="h-48 bg-gray-900 rounded-xl animate-pulse" />;
    const W = 500, H = 160, PAD = { l: 44, r: 8, t: 8, b: 24 };
    const prices = candles.flatMap(c => [c.high, c.low]);
    const min    = Math.min(...prices) * 0.995;
    const max    = Math.max(...prices) * 1.005;
    const range  = max - min || 1;
    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;
    const toX    = (i: number) => PAD.l + (i / Math.max(candles.length - 1, 1)) * chartW;
    const toY    = (v: number) => PAD.t + chartH - ((v - min) / range) * chartH;
    const barW   = Math.max(2, (chartW / candles.length) * 0.6);
    const lastCandle = candles[candles.length - 1];
    const isUp = lastCandle ? lastCandle.close >= candles[0].open : true;

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD.l} x2={W - PAD.r}
            y1={PAD.t + chartH * (1 - f)} y2={PAD.t + chartH * (1 - f)}
            stroke="#1f2937" strokeWidth="1" />
        ))}
        {[0, 0.5, 1].map(f => (
          <text key={f} x={PAD.l - 4} y={PAD.t + chartH * (1 - f) + 4}
            fontSize="8" fill="#4b5563" textAnchor="end">
            ${(min + range * f).toFixed(0)}
          </text>
        ))}
        {candles.map((c, i) => {
          const up    = c.close >= c.open;
          const color = up ? "#22c55e" : "#ef4444";
          const bodyY = toY(Math.max(c.open, c.close));
          const bodyH = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
          return (
            <g key={i}>
              <line x1={toX(i)} x2={toX(i)} y1={toY(c.high)} y2={toY(c.low)} stroke={color} strokeWidth="1" />
              <rect x={toX(i) - barW / 2} y={bodyY} width={barW} height={bodyH} fill={color} rx="0.5" />
            </g>
          );
        })}
        {[0, Math.floor(candles.length / 2), candles.length - 1].map(i => (
          candles[i] && (
            <text key={i} x={toX(i)} y={H - 4} fontSize="7" fill="#4b5563" textAnchor="middle">
              {candles[i].time.slice(5)}
            </text>
          )
        ))}
      </svg>
    );
  };

  return (
    <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 text-white">

      {/* Header — Robinhood style */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={token.cardImage} alt={token.playerName}
              className="w-12 h-12 rounded-full object-cover bg-gray-800" />
            <div>
              <h2 className="font-black text-lg leading-tight">{token.playerName}</h2>
              <p className="text-gray-400 text-xs">{token.cardName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">${currentPrice.toFixed(2)}</p>
            <p className={`text-sm font-bold ${token.changePct24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {token.changePct24h >= 0 ? "+" : ""}{token.changePct24h.toFixed(1)}% today
            </p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Bid",    value: book?.bids[0]?.price ? `$${book.bids[0].price}` : "—" },
            { label: "Ask",    value: book?.asks[0]?.price ? `$${book.asks[0].price}` : "—" },
            { label: "Spread", value: book?.spread ? `$${book.spread.toFixed(2)}` : "—"     },
            { label: "Volume", value: token.volume24h > 0 ? token.volume24h.toString() : "0" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl px-2 py-2 text-center">
              <p className="text-gray-500 text-xs">{s.label}</p>
              <p className="text-white font-bold text-sm">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5">

        {/* Left: Chart */}
        <div className="col-span-3 border-r border-gray-800">
          <div className="flex border-b border-gray-800">
            {(["chart", "book"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                  tab === t ? "text-white border-b-2 border-green-500" : "text-gray-500 hover:text-gray-300"
                }`}>
                {t === "chart" ? "Chart" : "Order Book"}
              </button>
            ))}
          </div>

          {tab === "chart" && (
            <div className="p-4">
              <CandleChart />
              <div className="mt-3 space-y-1">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Recent trades</p>
                {trades.length === 0 ? (
                  <p className="text-gray-600 text-xs">No trades yet — be the first</p>
                ) : trades.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-900">
                    <span className="text-gray-500">{new Date(t.executedAt).toLocaleTimeString()}</span>
                    <span className="text-white font-mono font-bold">${t.price.toFixed(2)}</span>
                    <span className="text-gray-400">{t.shares} shares</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "book" && (
            <div className="p-4">
              <p className="text-red-400 text-xs font-semibold uppercase mb-2">Asks (Sell orders)</p>
              <div className="space-y-0.5 mb-3">
                {(book?.asks ?? []).slice(0, 5).reverse().map((ask, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 px-2 bg-red-950/20 rounded">
                    <span className="text-red-400 font-mono">${ask.price}</span>
                    <span className="text-gray-400">{ask.shares} shares</span>
                  </div>
                ))}
                {(book?.asks ?? []).length === 0 && <p className="text-gray-600 text-xs">No asks</p>}
              </div>
              <div className="border-t border-gray-800 py-2 text-center">
                <span className="text-white font-black text-sm">${currentPrice.toFixed(2)}</span>
                <span className="text-gray-500 text-xs ml-2">Last price</span>
              </div>
              <p className="text-green-400 text-xs font-semibold uppercase mb-2 mt-3">Bids (Buy orders)</p>
              <div className="space-y-0.5">
                {(book?.bids ?? []).slice(0, 5).map((bid, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 px-2 bg-green-950/20 rounded">
                    <span className="text-green-400 font-mono">${bid.price}</span>
                    <span className="text-gray-400">{bid.shares} shares</span>
                  </div>
                ))}
                {(book?.bids ?? []).length === 0 && <p className="text-gray-600 text-xs">No bids</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Trade form — Robinhood style */}
        <div className="col-span-2 p-4 space-y-3">

          {/* Buy / Sell tabs */}
          <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-800">
            <button onClick={() => setMode("buy")}
              className={`py-2.5 text-sm font-black transition ${
                mode === "buy" ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              Buy
            </button>
            <button onClick={() => setMode("sell")}
              className={`py-2.5 text-sm font-black transition ${
                mode === "sell" ? "bg-red-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              Sell
            </button>
          </div>

          {/* Market / Limit */}
          <div className="grid grid-cols-2 gap-1 bg-gray-900 rounded-xl p-1">
            {(["market", "limit"] as const).map(t => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                  orderType === t ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Market order info */}
          {orderType === "market" && ammQuote && (
            <div className="bg-gray-900 rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Market price</span>
                <span className="text-white font-bold">${ammQuote.price}/share</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{mode === "sell" ? "You receive" : "You get"}</span>
                <span className="text-green-400 font-black">
                  {mode === "sell" ? `$${ammQuote.sellReturn} USDC` : `${ammQuote.buyReturn} shares`}
                </span>
              </div>
              {Math.abs(ammQuote.impact) > 2 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Price impact</span>
                  <span className="text-yellow-400 font-semibold">{ammQuote.impact > 0 ? "+" : ""}{ammQuote.impact}% ⚠️</span>
                </div>
              )}
            </div>
          )}

          {/* Limit price (only for limit orders) */}
          {orderType === "limit" && (
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Limit Price ($)</label>
              <input type="number" step="0.01" value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          )}

          {/* Shares */}
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Shares</label>
            <input type="number" min="1" max="100" value={shares}
              onChange={e => setShares(e.target.value)}
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
              <span className="text-white">${orderType === "market" ? (ammQuote?.price ?? currentPrice).toFixed(2) : price}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-1">
              <span className="text-gray-400 font-semibold">Est. Total</span>
              <span className="text-white font-black">${total}</span>
            </div>
          </div>

          {error   && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          {/* Trade button */}
          {!showConfirm ? (
            <button
              onClick={() => effectiveWallet ? setShowConfirm(true) : setError("Sign in to trade")}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-black text-sm transition disabled:opacity-50 ${
                mode === "buy"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}>
              {!effectiveWallet ? "Sign in to trade" : `Review ${mode === "buy" ? "Buy" : "Sell"} Order`}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs space-y-1">
                <p className="text-gray-400 font-semibold text-center mb-2">Confirm Order</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Action</span>
                  <span className={`font-black ${mode === "buy" ? "text-green-400" : "text-red-400"}`}>
                    {mode === "buy" ? "BUY" : "SELL"} {orderType.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shares</span>
                  <span className="text-white">{shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="text-white">${orderType === "market" ? "Market" : price}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-1">
                  <span className="text-gray-400 font-semibold">Total</span>
                  <span className="text-white font-black">${total}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowConfirm(false)}
                  className="py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-bold hover:border-gray-500 transition">
                  Cancel
                </button>
                <button onClick={handleTrade} disabled={loading}
                  className={`py-2.5 rounded-xl text-white text-sm font-black transition disabled:opacity-50 ${
                    mode === "buy" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
                  }`}>
                  {loading ? "..." : mode === "buy" ? "Buy with USDC" : "Confirm Sell"}
                </button>
                {mode === "buy" && (
                  <button onClick={handleCardPayment} disabled={loading}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black transition disabled:opacity-50 col-span-2 w-full mt-1">
                    💳 Buy with Card
                  </button>
                )}
              </div>
            </div>
          )}

          {/* My open orders */}
          {myOrders.filter(o => o.status === "OPEN" || o.status === "PARTIAL").length > 0 && (
            <div className="border-t border-gray-800 pt-3">
              <p className="text-gray-500 text-xs font-semibold uppercase mb-2">Open Orders</p>
              <div className="space-y-2">
                {myOrders.filter(o => o.status === "OPEN" || o.status === "PARTIAL").map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-2">
                    <div>
                      <span className={`text-xs font-black ${o.type === "BUY" ? "text-green-400" : "text-red-400"}`}>{o.type}</span>
                      <p className="text-white text-xs font-bold">{o.shares} shares @ ${o.price}</p>
                      <p className="text-gray-500 text-xs">{o.filled}/{o.shares} filled</p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch("/api/cards/trade", {
                          method:  "POST",
                          headers: { "Content-Type": "application/json" },
                          body:    JSON.stringify({ action: "cancel", cardId: token.id, orderId: o.id, wallet: effectiveWallet ?? "" }),
                        });
                        load(); loadMyOrders();
                      }}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded-lg">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PSA Vault */}
          <div className="border border-gray-800 rounded-xl p-3 space-y-1">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Vault</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">PSA Cert</span>
              <span className="text-blue-400 font-mono text-xs">{token.psaCert}</span>
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
