"use client";

// ─── components/cards/PriceChart.tsx ─────────────────────────────────────────

import type { EbaySale } from "@/lib/cardTypes";

export default function PriceChart({ sales }: { sales: EbaySale[] }) {
  if (sales.length < 2) return null;

  const prices  = [...sales].reverse().map((s) => s.price);
  const min     = Math.min(...prices) * 0.98;
  const max     = Math.max(...prices) * 1.02;
  const range   = max - min || 1;
  const W = 280, H = 80;
  const PAD = { l: 8, r: 8, t: 8, b: 8 };
  const chartW  = W - PAD.l - PAD.r;
  const chartH  = H - PAD.t - PAD.b;

  const toX = (i: number) => PAD.l + (i / (prices.length - 1)) * chartW;
  const toY = (v: number) => PAD.t + chartH - ((v - min) / range) * chartH;

  const points  = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const line    = `M ${points.join(" L ")}`;
  const area    = `M ${toX(0)},${PAD.t + chartH} L ${points.join(" L ")} L ${toX(prices.length - 1)},${PAD.t + chartH} Z`;

  const isUp    = prices[prices.length - 1] >= prices[0];
  const color   = isUp ? "#22c55e" : "#ef4444";
  const fill    = isUp ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)";
  const latest  = prices[prices.length - 1];

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-500 text-xs">eBay sales (last 14 days)</span>
        <span className={`text-sm font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
          ${latest}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <path d={area} fill={fill} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={toX(prices.length - 1)} cy={toY(latest)} r="3" fill={color} />
      </svg>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{sales[sales.length - 1]?.date}</span>
        <span>{sales[0]?.date}</span>
      </div>
    </div>
  );
}
