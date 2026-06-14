"use client";

import type { Signal } from "@/lib/cardTypes";

const STYLES: Record<Signal, string> = {
  BUY:  "bg-green-100 text-green-700 border border-green-300",
  SELL: "bg-red-100 text-red-700 border border-red-300",
  HOLD: "bg-yellow-100 text-yellow-700 border border-yellow-300",
};

const DOT: Record<Signal, string> = {
  BUY:  "bg-green-500",
  SELL: "bg-red-500",
  HOLD: "bg-yellow-500",
};

export default function SignalBadge({ signal, confidence }: { signal: Signal; confidence: number }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-black ${STYLES[signal]}`}>
      <span className={`w-2 h-2 rounded-full ${DOT[signal]} animate-pulse`} />
      {signal}
      <span className="text-xs font-normal opacity-60">{confidence}%</span>
    </div>
  );
}