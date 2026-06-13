"use client";

// ─── EquityCurve.tsx ──────────────────────────────────────────────────────────
// Renders the live equity curve as an SVG sparkline using equityHistory from FundContext.

import { useFund } from "@/context/FundContext";

const W = 600;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 24, left: 64 };

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatPct(n: number, sign = true): string {
  return `${sign && n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function EquityCurve() {
  const { equityHistory, drawdown, sharpe, tradeCount } = useFund();

  const history = equityHistory;
  const STARTING = 1_000_000;

  const latest  = history[history.length - 1]?.equity ?? STARTING;
  const peak    = Math.max(...history.map((p) => p.equity), STARTING);
  const trough  = Math.min(...history.map((p) => p.equity), STARTING);
  const totalPnL = latest - STARTING;
  const totalPct = (totalPnL / STARTING) * 100;

  // Chart bounds
  const minVal = Math.min(trough, STARTING) * 0.999;
  const maxVal = Math.max(peak, STARTING)   * 1.001;
  const range  = maxVal - minVal || 1;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  function toX(i: number): number {
    if (history.length <= 1) return PAD.left;
    return PAD.left + (i / (history.length - 1)) * chartW;
  }

  function toY(val: number): number {
    return PAD.top + chartH - ((val - minVal) / range) * chartH;
  }

  // Build SVG path
  const points = history.map((p, i) => `${toX(i).toFixed(1)},${toY(p.equity).toFixed(1)}`);
  const linePath = points.length > 1 ? `M ${points.join(" L ")}` : "";

  // Filled area path
  const areaPath = points.length > 1
    ? `M ${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L ${points.join(" L ")} L ${toX(history.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`
    : "";

  // Color: green if up, red if down
  const isUp    = totalPnL >= 0;
  const accent  = isUp ? "#22c55e" : "#ef4444";
  const areaFill = isUp ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)";

  // Y-axis labels
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Equity Curve</h2>
          <p className="text-sm text-gray-400">Live portfolio performance</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
            {formatUSD(latest)}
          </p>
          <p className={`text-sm ${isUp ? "text-green-400" : "text-red-400"}`}>
            {formatPct(totalPct)} all-time
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full" style={{ height: H }}>
        {history.length < 2 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Accumulating data…
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            {/* Y-axis ticks */}
            {yTicks.map((v, i) => (
              <g key={i}>
                <line
                  x1={PAD.left}
                  y1={toY(v)}
                  x2={W - PAD.right}
                  y2={toY(v)}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 6}
                  y={toY(v)}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="rgba(156,163,175,0.8)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {(v / 1000).toFixed(0)}k
                </text>
              </g>
            ))}

            {/* Starting equity reference line */}
            <line
              x1={PAD.left}
              y1={toY(STARTING)}
              x2={W - PAD.right}
              y2={toY(STARTING)}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Area fill */}
            <path d={areaPath} fill={areaFill} />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Latest dot */}
            <circle
              cx={toX(history.length - 1)}
              cy={toY(latest)}
              r="3"
              fill={accent}
            />
          </svg>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <StatCell label="Total P&L"   value={formatUSD(totalPnL)}   color={isUp ? "text-green-400" : "text-red-400"} />
        <StatCell label="Drawdown"    value={`-${drawdown.toFixed(2)}%`} color="text-red-400" />
        <StatCell label="Sharpe"      value={sharpe.toFixed(2)}      color={sharpe >= 1 ? "text-green-400" : sharpe >= 0 ? "text-yellow-400" : "text-red-400"} />
        <StatCell label="Trades"      value={String(tradeCount)}     color="text-blue-400" />
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`font-semibold text-sm ${color}`}>{value}</p>
    </div>
  );
}
