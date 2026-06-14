"use client";

// ─── components/cards/SignalBadge.tsx ─────────────────────────────────────────

import type { Signal } from "@/lib/cardTypes";

const STYLES: Record<Signal, string> = {
  BUY:  "bg-green-500/15 text-green-400 border border-green-500/30",
  SELL: "bg-red-500/15 text-red-400 border border-red-500/30",
  HOLD: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
};

export default function SignalBadge({ signal, confidence }: { signal: Signal; confidence: number }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${STYLES[signal]}`}>
      <span className={`w-2 h-2 rounded-full ${
        signal === "BUY" ? "bg-green-400" : signal === "SELL" ? "bg-red-400" : "bg-yellow-400"
      } animate-pulse`} />
      {signal}
      <span className="text-xs font-normal opacity-70">{confidence}% conf</span>
    </div>
  );
}
