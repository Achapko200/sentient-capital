"use client";

import { useState } from "react";
import { getCandleTimestamp, type Candle } from "@/lib/cardToken";

type Props = { candles: Candle[] };

const DAY_MS = 86_400_000;
const WIDTH = 500;
const HEIGHT = 232;
const PAD = { left: 58, right: 20, top: 12, bottom: 30 };
const GREEN = "#00c805";
const RED = "#ff5000";

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
  const now = Date.now();
  const start = now - 14 * DAY_MS;
  const visible = candles
    .filter(candle => {
      const timestamp = getCandleTimestamp(candle);
      return timestamp >= start && timestamp <= now &&
        [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite);
    })
    .sort((a, b) => getCandleTimestamp(a) - getCandleTimestamp(b));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (visible.length === 0) return null;

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const rawMin = Math.min(...visible.map(candle => candle.low));
  const rawMax = Math.max(...visible.map(candle => candle.high));
  const rawRange = rawMax - rawMin;
  const padding = rawRange > 0 ? rawRange * 0.1 : Math.max(rawMax * 0.01, 1);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const range = max - min || 1;
  const slotWidth = chartWidth / 14;
  const bodyWidth = Math.max(4, Math.min(11, slotWidth * 0.55));
  const toX = (candle: Candle) => PAD.left +
    ((getCandleTimestamp(candle) - start) / (14 * DAY_MS)) * chartWidth;
  const toY = (value: number) => PAD.top + chartHeight -
    ((value - min) / range) * chartHeight;
  const active = visible[Math.min(activeIndex ?? visible.length - 1, visible.length - 1)];
  const activeUp = active.close >= active.open;
  const activeColor = activeUp ? GREEN : RED;
  const dateTicks = [0, 7, 14];

  return (
    <div className="rounded-xl bg-[#080d18] px-2 pt-3 pb-2 sm:px-3">
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
        aria-label={`14-day candlestick chart with ${visible.length} dated price observations`}
      >
        <defs>
          <linearGradient id="candle-chart-wash" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0d1725" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#080d18" stopOpacity="0" />
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
                stroke="#263142" strokeWidth="1" strokeDasharray={tick === 4 ? undefined : "2 5"} />
              <text x={PAD.left - 9} y={y + 3} fill="#697586" fontSize="9"
                textAnchor="end" className="tabular-nums">{formatPrice(value)}</text>
            </g>
          );
        })}

        {active && (
          <line x1={toX(active)} x2={toX(active)} y1={PAD.top} y2={PAD.top + chartHeight}
            stroke={activeColor} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="3 4" />
        )}

        {visible.map((candle, index) => {
          const up = candle.close >= candle.open;
          const color = up ? GREEN : RED;
          const x = toX(candle);
          const bodyY = toY(Math.max(candle.open, candle.close));
          const bodyHeight = Math.max(2, Math.abs(toY(candle.open) - toY(candle.close)));
          const selected = index === (activeIndex ?? visible.length - 1);
          return (
            <g key={`${getCandleTimestamp(candle)}-${index}`} role="button" tabIndex={0}
              aria-label={`${formatDate(getCandleTimestamp(candle))}: open ${formatPrice(candle.open)}, high ${formatPrice(candle.high)}, low ${formatPrice(candle.low)}, close ${formatPrice(candle.close)}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className="cursor-crosshair outline-none">
              <title>{`${formatDate(getCandleTimestamp(candle))} · O ${formatPrice(candle.open)} · H ${formatPrice(candle.high)} · L ${formatPrice(candle.low)} · C ${formatPrice(candle.close)} · ${candle.volume} listings`}</title>
              <line x1={x} x2={x} y1={toY(candle.high)} y2={toY(candle.low)}
                stroke={color} strokeWidth={selected ? "1.7" : "1.3"} strokeLinecap="round" />
              <rect x={x - bodyWidth / 2} y={bodyY} width={bodyWidth} height={bodyHeight}
                fill={color} stroke={color} strokeWidth="1" rx="1.5"
                className="transition-[opacity] duration-150"
                opacity={selected ? "1" : "0.86"} />
              {selected && <circle cx={x} cy={toY(candle.close)} r="2.5" fill={color}
                stroke="#080d18" strokeWidth="1.5" />}
            </g>
          );
        })}

        {dateTicks.map(day => {
          const timestamp = start + day * DAY_MS;
          const x = PAD.left + (day / 14) * chartWidth;
          return (
            <text key={day} x={x} y={HEIGHT - 7} fill="#697586" fontSize="9"
              textAnchor={day === 0 ? "start" : day === 14 ? "end" : "middle"}>
              {formatDate(timestamp)}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center justify-between px-2 pt-1 text-[9px] text-slate-600">
        <span>Daily price observations</span>
        <span>{visible.length} {visible.length === 1 ? "day" : "days"} with data</span>
      </div>
    </div>
  );
}