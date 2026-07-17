"use client";

import { useState, useEffect } from "react";
import { useAuth }             from "@/lib/auth-context";
import { supabase }            from "@/lib/supabase";
import type { Player }         from "@/lib/cardTypes";

type Props = { player: Player };

export default function CardPurchasePanel({ player }: Props) {
  const { email } = useAuth();
  const [mode,      setMode]      = useState<"buy" | "sell">("buy");

  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState("");
  const [error,     setError]     = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [cardData,  setCardData]  = useState<any>(null);

  const [orderbookData, setOrderbookData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/cards/${player.id}`)
      .then(r => r.json())
      .then(setCardData)
      .catch(() => {});
    fetch(`/api/cards/orderbook?cardId=${player.id}`)
      .then(r => r.json())
      .then(setOrderbookData)
      .catch(() => {});
  }, [player.id]);

  const price    = cardData?.avgPrice ?? 0;
  const signal   = cardData?.cardSignal?.signal ?? "HOLD";
  const candles  = orderbookData?.candles ?? [];

  // Candlestick chart
  const CandleChart = () => {
    if (candles.length === 0) return <div className="h-40 bg-gray-900 rounded-xl animate-pulse" />;
    const W = 500, H = 160, PAD = { l: 44, r: 8, t: 8, b: 24 };
    const prices = candles.flatMap((c: any) => [c.high, c.low]);
    const min    = Math.min(...prices) * 0.995;
    const max    = Math.max(...prices) * 1.005;
    const range  = max - min || 1;
    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;
    const toX    = (i: number) => PAD.l + (i / Math.max(candles.length - 1, 1)) * chartW;
    const toY    = (v: number) => PAD.t + chartH - ((v - min) / range) * chartH;
    const barW   = Math.max(2, (chartW / candles.length) * 0.6);

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
        {candles.map((c: any, i: number) => {
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
        {[0, Math.floor(candles.length / 2), candles.length - 1].map((i: number) => (
          candles[i] && (
            <text key={i} x={toX(i)} y={H - 4} fontSize="7" fill="#4b5563" textAnchor="middle">
              {candles[i].time.slice(5)}
            </text>
          )
        ))}
      </svg>
    );
  };

  const handleUsdcPay = async () => {
    if (!email) { setError("Sign in to buy"); return; }

    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sign in to buy"); return; }
      // For now redirect to login with Dynamic wallet
      window.location.href = "/login?crypto=true";
    } catch (err: any) {
      setError(err.message ?? "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSellRequest = async () => {
    if (!email) { setError("Sign in to sell"); return; }
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sign in to sell"); return; }
      const { error: dbError } = await supabase.from("card_orders").insert({
        user_id:     user.id,
        player_name: player.name,
        card_name:   player.cardName ?? "",
        price:       price,
        fee:         price * 0.05,
        type:        "sell",
        status:      "pending",
      });
      if (dbError) throw dbError;
      setSuccess("Sale request submitted! We will email you a prepaid shipping label within 24 hours.");
      setTimeout(() => { setShowConfirm(false); setSuccess(""); }, 3000);
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to submit sale request");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!email) { setError("Sign in to buy"); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sign in to buy"); return; }

      const res = await fetch("/api/stripe/pay", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          cardId:        player.id,
          playerName:    player.name,
          shares:        1,
          pricePerShare: price,
          userId:        user.id,
          email:         user.email,

          mode,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "Payment failed");
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 text-white">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={player.cardImage} alt={player.name}
              className="w-12 h-12 rounded-full object-cover bg-gray-800" />
            <div>
              <h2 className="font-black text-lg">{player.name}</h2>
              <p className="text-gray-400 text-xs">{player.cardName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">${price.toFixed(2)}</p>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              signal === "BUY"  ? "bg-green-900 text-green-400" :
              signal === "SELL" ? "bg-red-900 text-red-400" :
                                  "bg-yellow-900 text-yellow-400"
            }`}>{signal}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* Chart */}
        <div className="col-span-3 border-r border-gray-800 p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase mb-3">Price History</p>
          <CandleChart />

          {/* Stats */}
          {cardData && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "1 Week",    value: `${cardData.priceHistory?.week?.changePct > 0 ? "+" : ""}${cardData.priceHistory?.week?.changePct ?? 0}%` },
                { label: "3 Months",  value: `${cardData.priceHistory?.threeMonth?.changePct > 0 ? "+" : ""}${cardData.priceHistory?.threeMonth?.changePct ?? 0}%` },
                { label: "eBay Avg",  value: `$${cardData.avgPrice ?? 0}` },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-xl p-2 text-center">
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className="text-white font-bold text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buy/Sell Panel */}
        <div className="col-span-2 p-4 space-y-3">

          {/* Buy / Sell tabs */}
          <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-800">
            <button onClick={() => { setMode("buy"); setShowConfirm(false); setError(""); }}
              className={`py-2.5 text-sm font-black transition ${
                mode === "buy" ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              Buy
            </button>
            <button onClick={() => { setMode("sell"); setShowConfirm(false); setError(""); }}
              className={`py-2.5 text-sm font-black transition ${
                mode === "sell" ? "bg-red-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              Sell
            </button>
          </div>

          {/* Price summary */}
          <div className="bg-gray-900 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Market price</span>
              <span className="text-white font-bold">${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction fee (5%)</span>
              <span className="text-gray-400">${(price * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-1">
              <span className="text-gray-400 font-semibold">
                {mode === "buy" ? "Total to pay" : "You receive"}
              </span>
              <span className="text-white font-black">
                ${mode === "buy" ? (price * 1.05).toFixed(2) : (price * 0.95).toFixed(2)}
              </span>
            </div>
          </div>

          {mode === "buy" && !showConfirm && (
            <div className="bg-gray-900 rounded-xl p-3 text-xs text-gray-400">
              <p className="text-gray-300 font-semibold mb-1">📦 Shipping included</p>
              <p>Enter your shipping address at checkout. Standard (3-7 days) or Express (1-3 days) shipping available.</p>
            </div>
          )}

          {/* Sell info */}
          {mode === "sell" && !showConfirm && (
            <div className="bg-gray-900 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">How selling works:</p>
              <p>1. You confirm the sale at market price</p>
              <p>2. We send you a prepaid shipping label</p>
              <p>3. Ship the card to our vault</p>
              <p>4. You get paid within 3-5 business days</p>
            </div>
          )}

          {error   && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          {/* Confirm step */}
          {showConfirm ? (
            <div className="space-y-2">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs space-y-1">
                <p className="text-gray-400 font-semibold text-center mb-2">Confirm {mode === "buy" ? "Purchase" : "Sale"}</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Card</span>
                  <span className="text-white font-bold truncate ml-2">{player.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="text-white">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee (5%)</span>
                  <span className="text-gray-400">${(price * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-1">
                  <span className="text-gray-400 font-semibold">Total</span>
                  <span className="text-white font-black">
                    ${mode === "buy" ? (price * 1.05).toFixed(2) : (price * 0.95).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-800 pt-1">
                    <p className="text-gray-500 text-xs">Shipping address collected at checkout</p>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowConfirm(false)}
                  className="py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-bold hover:border-gray-500 transition">
                  Back
                </button>
                {mode === "buy" ? (
                  <button onClick={handleBuy} disabled={loading}
                    className="py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-black transition disabled:opacity-50">
                    {loading ? "..." : "Pay Now"}
                  </button>
                ) : (
                  <button onClick={handleSellRequest} disabled={loading}
                    className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-black transition disabled:opacity-50">
                    {loading ? "..." : "Submit Sale"}
                  </button>
                )}
              </div>
              {mode === "buy" && (<>
                <button onClick={handleBuy} disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black transition disabled:opacity-50">
                  💳 Pay with Credit Card
                </button>
                <button onClick={handleUsdcPay} disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-black transition disabled:opacity-50">
                  ⚡ Pay with USDC (Crypto)
                </button>
              </>)}
            </div>
          ) : (
            <button
              onClick={() => email ? setShowConfirm(true) : setError("Sign in to trade")}
              className={`w-full py-3 rounded-xl font-black text-sm transition ${
                mode === "buy"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}>
              {!email ? "Sign in to trade" : mode === "buy" ? `Buy for $${(price * 1.05).toFixed(2)}` : `Sell for $${(price * 0.95).toFixed(2)}`}
            </button>
          )}

          {/* PSA Vault info */}
          <div className="border border-gray-800 rounded-xl p-3 space-y-1">
            <p className="text-gray-500 text-xs font-semibold uppercase">Card Info</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Grade</span>
              <span className="text-white font-bold">PSA 10</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Vault status</span>
              <span className="text-green-400 font-bold">✓ VERIFIED</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Shipping</span>
              <span className="text-white">3-5 business days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
