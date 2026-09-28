"use client";

import { useEffect, useMemo, useState } from "react";
import { getCandleTimestamp, type Candle } from "@/lib/cardToken";

type Props = { candles: Candle[] };
type RangeKey = "1W" | "3M";

const DAY_MS = 86_400_000;
const WIDTH = 500;
const HEIGHT = 232;
const PAD = { left: 58, right: 20, top: 12, bottom: 30 };
const GREEN = "#26d07c";
const RED = "#ff5c5c";
const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: "1W", label: "1 Week", days: 7 },
  { key: "3M", label: "3 Months", days: 90 },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function CandlestickChart({ candles }: Props) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("1W");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selectedRangeConfig = RANGE_OPTIONS.find(option => option.key === selectedRange) ?? RANGE_OPTIONS[0];
  const now = Date.now();
  const rangeStart = now - selectedRangeConfig.days * DAY_MS;

  const visible = useMemo(() => candles
    .filter(candle => {
      const timestamp = getCandleTimestamp(candle);
      return timestamp >= rangeStart && timestamp <= now && [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite);
    })
    .sort((a, b) => getCandleTimestamp(a) - getCandleTimestamp(b)), [candles, now, rangeStart]);

  useEffect(() => {
    if (visible.length === 0) {
      setActiveIndex(null);
      return;
    }
    setActiveIndex(prev => {
      const bounded = prev == null ? visible.length - 1 : Math.min(prev, visible.length - 1);
      return bounded >= 0 ? bounded : visible.length - 1;
    });
  }, [visible]);

  if (visible.length === 0) return null;

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const chartStart = Math.min(...visible.map(candle => getCandleTimestamp(candle)));
  const chartEnd = Math.max(...visible.map(candle => getCandleTimestamp(candle)));
  const chartRange = Math.max(chartEnd - chartStart, DAY_MS);
  const rawMin = Math.min(...visible.map(candle => candle.low));
  const rawMax = Math.max(...visible.map(candle => candle.high));
  const rawRange = rawMax - rawMin;
  const padding = rawRange > 0 ? rawRange * 0.12 : Math.max(rawMax * 0.02, 1);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const range = max - min || 1;
  const candleStep = visible.length > 1 ? chartWidth / (visible.length - 1) : chartWidth;
  const bodyWidth = Math.max(10, Math.min(18, candleStep * 0.82));
  const toX = (timestamp: number) => PAD.left + ((timestamp - chartStart) / chartRange) * chartWidth;
  const toY = (value: number) => PAD.top + chartHeight - ((value - min) / range) * chartHeight;
  const active = visible[Math.min(activeIndex ?? visible.length - 1, visible.length - 1)];
  const activeUp = active.close >= active.open;
  const activeColor = activeUp ? GREEN : RED;
  const dateTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#060b12] px-2 pt-3 pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.015)] sm:px-3">
      <div className="flex items-start justify-between gap-3 px-2 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {formatDate(getCandleTimestamp(active))}
          </p>
          <p className="mt-0.5 text-xl font-bold tracking-tight text-white tabular-nums">
            {formatPrice(active.close)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5 text-[10px] tabular-nums sm:grid-cols-4">
          {[
            { label: "O", value: active.open },
            { label: "H", value: active.high },
            { label: "L", value: active.low },
            { label: "C", value: active.close },
          ].map(item => (
            <span key={item.label} className="whitespace-nowrap text-slate-400">
              <span className="mr-1 text-slate-600">{item.label}</span>{formatPrice(item.value)}
            </span>
          ))}
        </div>
      </div>

      <svg
        className="block w-full overflow-visible"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${selectedRangeConfig.label} candlestick chart with ${visible.length} dated price observations`}
      >
        <defs>
          <linearGradient id="candle-chart-wash" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0c1520" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#060b12" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={PAD.left} y={PAD.top} width={chartWidth} height={chartHeight}
          fill="url(#candle-chart-wash)" />

        {[0, 1, 2, 3, 4].map(tick => {
          const fraction = tick / 4;
          const y = PAD.top + chartHeight * fraction;
          const value = max - range * fraction;
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y}
                stroke="#182334" strokeWidth="1" strokeDasharray={tick === 4 ? undefined : "2 5"} />
              <text x={PAD.left - 9} y={y + 3} fill="#758194" fontSize="9"
                textAnchor="end" className="tabular-nums">{formatPrice(value)}</text>
            </g>
          );
        })}

        {active && (
          <line x1={toX(getCandleTimestamp(active))} x2={toX(getCandleTimestamp(active))} y1={PAD.top} y2={PAD.top + chartHeight}
            stroke={activeColor} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="3 4" />
        )}

        {visible.map((candle, index) => {
          const timestamp = getCandleTimestamp(candle);
          const up = candle.close >= candle.open;
          const color = up ? GREEN : RED;
          const x = PAD.left + index * candleStep;
          const openY = toY(candle.open);
          const closeY = toY(candle.close);
          const wickTop = toY(candle.high);
          const wickBottom = toY(candle.low);
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(2, Math.abs(openY - closeY));
          const selected = index === (activeIndex ?? visible.length - 1);
          return (
            <g key={`${timestamp}-${index}`} role="button" tabIndex={0}
              aria-label={`${formatDate(timestamp)}: open ${formatPrice(candle.open)}, high ${formatPrice(candle.high)}, low ${formatPrice(candle.low)}, close ${formatPrice(candle.close)}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className="cursor-crosshair outline-none">
              <title>{`${formatDate(timestamp)} · O ${formatPrice(candle.open)} · H ${formatPrice(candle.high)} · L ${formatPrice(candle.low)} · C ${formatPrice(candle.close)} · ${candle.volume} listings`}</title>
              <line x1={x} x2={x} y1={wickTop} y2={wickBottom}
                stroke={color} strokeWidth={selected ? "2.6" : "1.8"} strokeLinecap="round" />
              <rect x={x - bodyWidth / 2} y={bodyY} width={bodyWidth} height={Math.max(6, bodyHeight)}
                fill={color} stroke={color} strokeWidth="1.25" rx="1.75"
                className="transition-[opacity] duration-150"
                opacity={selected ? "1" : "0.94"} />
            </g>
          );
        })}

        {dateTicks.map((fraction, index) => {
          const timestamp = chartStart + fraction * chartRange;
          const x = PAD.left + fraction * chartWidth;
          return (
            <text key={`${fraction}-${index}`} x={x} y={HEIGHT - 7} fill="#7a8798" fontSize="9"
              textAnchor={fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"}>
              {fraction === 0 || fraction === 1 ? formatDate(timestamp) : ""}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center justify-between px-2 pt-1 text-[9px] text-slate-600">
        <span>Daily price observations</span>
        <span>{visible.length} {visible.length === 1 ? "day" : "days"} with data</span>
      </div>
      <div className="mt-3 flex items-center gap-2 px-2">
        {RANGE_OPTIONS.map(option => {
          const isActive = option.key === selectedRange;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedRange(option.key)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                isActive
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}