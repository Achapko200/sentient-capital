"use client";

import { useEffect, useState, useCallback } from "react";
import type { CardData, Player }            from "@/lib/cardTypes";
import { subscribeToTrades }                from "@/lib/realtime";
import { useSubscription }                  from "@/lib/useSubscription";
import PriceChart                           from "@/components/cards/PriceChart";

type Props = {
  player:   Player;
  onTrade?: (player: Player) => void;
};

export default function PlayerCard({ player, onTrade }: Props) {
  const [data,           setData]           = useState<CardData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [expanded,       setExpanded]       = useState(false);
  const [lastTradePrice, setLastTradePrice] = useState<number | null>(null);
  const [priceFlash,     setPriceFlash]     = useState<"up" | "down" | null>(null);
  const { tier } = useSubscription();
  const canSeeEbay = tier === "pro" || tier === "elite";

  const load = useCallback(async () => {
    // Use pre-loaded batch data immediately — no API call needed
    if ((player as any).avgPrice !== undefined) {
      setData({
        avgPrice:     (player as any).avgPrice,
        priceChange:  (player as any).priceChange ?? 0,
        priceHistory: (player as any).priceHistory ?? {},
        liquidity:    (player as any).liquidity ?? {},
        sales:        (player as any).sales ?? [],
        stats:        null,
        sentiment:    null,
        cardSignal:   { signal: "HOLD", confidence: 50, reasons: [] },
        candles:      [],
      } as any);
      setLoading(false);
      return;
    }
    // Fallback: fetch individual player data
    try {
      const res  = await fetch(`/api/cards/${player.id}`);
      const json = await res.json();
      setData(json);
    } catch {}
    finally { setLoading(false); }
  }, [player.id, player]);

  // Load full stats only when expanded
  const loadFullStats = useCallback(async () => {
    try {
      const res  = await fetch(`/api/cards/${player.id}`);
      const json = await res.json();
      setData(json);
    } catch {}
  }, [player.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (expanded && data && !(data as any).stats) {
      loadFullStats();
    }
  }, [expanded, loadFullStats]);

  useEffect(() => {
    const channel = subscribeToTrades((cardId, price) => {
      if (cardId !== player.id) return;
      setLastTradePrice(prev => {
        setPriceFlash(prev === null ? null : price > prev ? "up" : "down");
        return price;
      });
    });
    return () => { channel?.unsubscribe?.(); };
  }, [player.id]);

  if (loading) return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
          <div className="h-2 w-20 rounded animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
        </div>
        <div className="text-right space-y-1.5">
          <div className="h-5 w-16 rounded animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
          <div className="h-2 w-10 rounded animate-pulse ml-auto" style={{ backgroundColor: "var(--bg-hover)" }} />
        </div>
      </div>
      <div className="h-2 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
      <div className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />)}
      </div>
      <div className="h-10 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-hover)" }} />
    </div>
  );

  if (!data) return null;

  const { stats, sales, sentiment, cardSignal, avgPrice, priceChange, priceHistory } = data;
  const displayPrice = lastTradePrice ?? avgPrice;
  const isUp         = priceChange >= 0;
  const signal       = cardSignal?.signal ?? "HOLD";

  // Polymarket-style signal colors — saturated, not muted
  const signalPalette = {
    BUY:  { bg: "#0a2e1a", text: "#00c278", border: "#00c278", dot: "#00c278" },
    HOLD: { bg: "#2a1f00", text: "#f59e0b", border: "#f59e0b", dot: "#f59e0b" },
    SELL: { bg: "#2e0a0a", text: "#ff3b30", border: "#ff3b30", dot: "#ff3b30" },
  };
  const pal = signalPalette[signal as keyof typeof signalPalette] ?? signalPalette.HOLD;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border:          `1px solid var(--border)`,
      }}>

      {/* Colored top stripe */}
      <div className="h-0.5" style={{ backgroundColor: pal.border }} />

      <div className="p-4">

        {/* Row 1 — player + price */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img src={player.cardImage} alt={player.name}
                className="w-11 h-11 rounded-full object-cover"
                style={{ backgroundColor: "#222" }} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ backgroundColor: pal.dot, borderColor: "var(--bg-card)" }} />
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{player.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8a8a8a" }}>{player.team}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black leading-none transition-colors ${
              priceFlash === "up" ? "text-green-400" : priceFlash === "down" ? "text-red-400" : ""
            }`} style={ !priceFlash ? { color: "var(--text-primary)" } : {}}>
              ${displayPrice}
            </p>
            <p className="text-sm font-black mt-0.5"
              style={{ color: isUp ? "#00c278" : "#ff3b30" }}>
              {isUp ? "▲" : "▼"} {Math.abs(priceChange)}%
            </p>
          </div>
        </div>

        {/* Row 2 — signal pill + sentiment + PSA */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Signal — Polymarket-style filled pill */}
          <span className="text-xs font-black px-3 py-1 rounded-full"
            style={{ backgroundColor: pal.bg, color: pal.text, border: `1px solid ${pal.border}` }}>
            {signal} · {cardSignal?.confidence ?? 0}%
          </span>

          {/* Sentiment */}
          {sentiment?.label && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              {sentiment.label}
            </span>
          )}

          <span className="ml-auto text-xs font-mono font-bold"
            style={{ color: "var(--text-primary)" }}>PSA 10</span>
        </div>

        {/* eBay chart */}
        {canSeeEbay && sales.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-primary)" }}>
            <PriceChart sales={sales} />
          </div>
        )}
        {!canSeeEbay && (
          <div className="mb-3 rounded-xl px-3 py-2 flex items-center justify-between"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "#8a8a8a" }}>🔒 eBay price chart — Pro feature</p>
            <a href="/pricing" className="text-xs font-black" style={{ color: "#2563eb" }}>Upgrade →</a>
          </div>
        )}

        {/* Price history — 3 pills */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "1W", data: priceHistory?.week       },
            { label: "3M", data: priceHistory?.threeMonth },
            { label: "1Y", data: priceHistory?.year       },
          ].map(({ label, data: d }) => {
            const pct = d?.changePct ?? 0;
            return (
              <div key={label} className="rounded-xl p-2 text-center"
                style={{ backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs mb-0.5" style={{ color: "#8a8a8a" }}>{label}</p>
                <p className="text-xs font-black"
                  style={{ color: pct >= 0 ? "#00c278" : "#ff3b30" }}>
                  {pct >= 0 ? "+" : ""}{pct}%
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button onClick={() => onTrade?.(player)}
          className="w-full py-2.5 rounded-xl font-black text-sm transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: pal.border, color: "#000" }}>
          Buy for ${(displayPrice * 1.10).toFixed(2)} (incl. 10% fee) →
        </button>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 text-xs font-semibold py-1 transition hover:opacity-80"
          style={{ color: "#8a8a8a" }}>
          {expanded ? "▲ Hide details" : "▼ Show stats & reasoning"}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 space-y-3">

            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "AVG", value: stats.avg.toFixed(3) },
                  { label: "HR",  value: String(stats.hr)     },
                  { label: "RBI", value: String(stats.rbi)    },
                  { label: "OPS", value: stats.ops.toFixed(3) },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-2 text-center"
                    style={{ backgroundColor: "var(--bg-primary)" }}>
                    <p className="text-xs mb-0.5" style={{ color: "#8a8a8a" }}>{s.label}</p>
                    <p className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Signal reasoning — colored left border */}
            {cardSignal?.reasons && (
              <div className="rounded-xl p-3"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderLeft:      `3px solid ${pal.border}`,
                }}>
                <p className="text-xs font-black mb-2" style={{ color: pal.text }}>
                  Signal reasoning
                </p>
                <ul className="space-y-1">
                  {cardSignal.reasons.map((r: string, i: number) => (
                    <li key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* eBay sales */}
            {canSeeEbay && sales.length > 0 && (
              <div className="rounded-xl p-3"
                style={{ backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs font-black mb-2" style={{ color: "#8a8a8a" }}>
                  Recent eBay sales
                </p>
                <div className="space-y-1.5">
                  {sales.slice(0, 4).map(s => (
                    <div key={s.id} className="flex justify-between text-xs">
                      <span style={{ color: "#8a8a8a" }}>{s.date}</span>
                      <span className="font-black" style={{ color: "var(--text-primary)" }}>${s.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
