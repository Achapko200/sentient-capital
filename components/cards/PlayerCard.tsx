"use client";

import { useEffect, useState, useCallback } from "react";
import type { CardData, Player }            from "@/lib/cardTypes";
import { subscribeToTrades }                from "@/lib/realtime";
import { supabase }                         from "@/lib/supabase";
import { useSubscription }                  from "@/lib/useSubscription";
import PriceChart                           from "@/components/cards/PriceChart";

type Props = {
  player:   Player;
  onTrade?: (player: Player) => void;
};

export default function PlayerCard({ player, onTrade }: Props) {
  const [data,          setData]          = useState<CardData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState(false);
  const [lastTradePrice, setLastTradePrice] = useState<number | null>(null);
  const [priceFlash,    setPriceFlash]    = useState<"up" | "down" | null>(null);
  const { tier } = useSubscription();
  const canSeeEbay = tier === "pro" || tier === "elite";

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/cards/${player.id}`);
      const json = await res.json();
      setData(json);
    } catch {}
    finally { setLoading(false); }
  }, [player.id]);

  useEffect(() => { load(); }, [load]);

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
    <div className="rounded-2xl animate-pulse h-48"
      style={{ backgroundColor: "var(--bg-card)" }} />
  );

  if (!data) return null;

  const { stats, sales, sentiment, cardSignal, avgPrice, priceChange, priceHistory, liquidity } = data;
  const displayPrice = lastTradePrice ?? avgPrice;
  const isUp         = priceChange >= 0;
  const signal       = cardSignal?.signal ?? "HOLD";

  const signalColor = signal === "BUY"  ? "#00c278" :
                      signal === "SELL" ? "#ff3b30" : "#f59e0b";

  const signalBg = signal === "BUY"  ? "rgba(0,194,120,0.1)" :
                   signal === "SELL" ? "rgba(255,59,48,0.1)" : "rgba(245,158,11,0.1)";

  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>

      {/* Top bar — signal color */}
      <div className="h-0.5 w-full" style={{ backgroundColor: signalColor }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={player.cardImage} alt={player.name}
                className="w-10 h-10 rounded-full object-cover"
                style={{ backgroundColor: "#222" }} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ backgroundColor: signalColor, borderColor: "var(--bg-card)" }} />
            </div>
            <div>
              <p className="font-black text-white text-sm">{player.name}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{player.team}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-black transition-colors ${
              priceFlash === "up"   ? "text-green-400" :
              priceFlash === "down" ? "text-red-400"   : "text-white"
            }`}>${displayPrice}</p>
            <p className="text-xs font-bold"
              style={{ color: isUp ? "#00c278" : "#ff3b30" }}>
              {isUp ? "+" : ""}{priceChange}%
            </p>
          </div>
        </div>

        {/* Signal badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ backgroundColor: signalBg, color: signalColor }}>
              {signal} {cardSignal?.confidence ?? 0}%
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {sentiment?.label ?? ""}
            </span>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            PSA 10
          </span>
        </div>

        {/* eBay price chart */}
        {canSeeEbay && sales.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
            <PriceChart sales={sales} />
          </div>
        )}
        {!canSeeEbay && (
          <div className="mb-3 rounded-xl px-3 py-2.5 flex items-center justify-between"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>🔒 eBay price chart</p>
            <a href="/pricing" className="text-xs font-semibold" style={{ color: "#2563eb" }}>Upgrade</a>
          </div>
        )}

        {/* Price history */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "1W",  data: priceHistory?.week       },
            { label: "3M",  data: priceHistory?.threeMonth },
            { label: "1Y",  data: priceHistory?.year       },
          ].map(({ label, data: d }) => (
            <div key={label} className="rounded-xl p-2 text-center"
              style={{ backgroundColor: "var(--bg-primary)" }}>
              <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>{label}</p>
              <p className="text-xs font-bold"
                style={{ color: (d?.changePct ?? 0) >= 0 ? "#00c278" : "#ff3b30" }}>
                {(d?.changePct ?? 0) >= 0 ? "+" : ""}{d?.changePct ?? 0}%
              </p>
            </div>
          ))}
        </div>

        {/* Buy button */}
        <button
          onClick={() => onTrade?.(player)}
          className="w-full py-2.5 rounded-xl font-black text-sm transition hover:opacity-90"
          style={{ backgroundColor: "#00c278", color: "#000" }}>
          Trade {player.name.split(" ").pop()}
        </button>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 text-xs font-semibold transition"
          style={{ color: "var(--text-secondary)" }}>
          {expanded ? "▲ Hide details" : "▼ Show details"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
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
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
                    <p className="text-white font-black text-sm">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {cardSignal?.reasons && (
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Signal reasoning</p>
                <ul className="space-y-1">
                  {cardSignal.reasons.map((r: string, i: number) => (
                    <li key={i} className="text-xs" style={{ color: "#cccccc" }}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {canSeeEbay && sales.length > 0 && (
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Recent eBay sales</p>
                <div className="space-y-1.5">
                  {sales.slice(0, 4).map(s => (
                    <div key={s.id} className="flex justify-between text-xs">
                      <span style={{ color: "var(--text-secondary)" }}>{s.date}</span>
                      <span className="text-white font-bold">${s.price}</span>
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
