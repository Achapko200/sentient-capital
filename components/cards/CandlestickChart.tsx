"use client";
// Robinhood / moomoo-style price chart: big live price, hover scrubbing, candles or line, volume bars.
import { useEffect, useMemo, useRef, useState } from "react";
import { getCandleTimestamp } from "@/lib/cardToken";

type Candle = { time?: number; timestamp?: number; open: number; high: number; low: number; close: number; volume?: number };
type Props  = { candles: Candle[] };

const UP = "#00C805", DOWN = "#FF5000", MUTED = "#8A8F98", LINE = "rgba(255,255,255,0.08)";
const RANGES = [{ key: "1W", days: 7 }, { key: "2W", days: 14 }] as const;
type RangeKey = typeof RANGES[number]["key"];

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day   = (t: number, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(t).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

export default function CandlestickChart({ candles }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [range, setRange] = useState<RangeKey>("2W");
  const [mode,  setMode]  = useState<"candle" | "line">("candle");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => setHover(null), [range, mode]);

  const data = useMemo(() => {
    const days   = RANGES.find(r => r.key === range)!.days;
    const cutoff = Date.now() - days * 86_400_000;
    return candles
      .map(c => ({ ...c, t: getCandleTimestamp(c as any) }))
      .filter(c => c.t >= cutoff && Number(c.close) > 0)
      .sort((a, b) => a.t - b.t);
  }, [candles, range]);

  // ── Layout ──
  const H = 300, TOP = 16, BOTTOM = 26, VOL = 46, AXIS = 60;
  const plotW  = Math.max(100, width - AXIS);
  const priceH = H - TOP - BOTTOM - VOL - 8;

  if (!data.length) {
    return (
      <div ref={wrapRef} className="w-full py-16 text-center text-sm" style={{ color: MUTED }}>
        No eBay price data in this range yet.
      </div>
    );
  }

  const lows  = data.map(c => c.low), highs = data.map(c => c.high);
  const lo = Math.min(...lows), hi = Math.max(...highs);
  const pad  = Math.max((hi - lo) * 0.18, hi * 0.04);
  const yMin = Math.max(0, lo - pad), yMax = hi + pad;
  const y    = (v: number) => TOP + ((yMax - v) / (yMax - yMin)) * priceH;
  const step = plotW / data.length;
  const x    = (i: number) => step * i + step / 2;
  const bodyW = Math.max(3, Math.min(16, step * 0.55));
  const maxVol = Math.max(1, ...data.map(c => c.volume ?? 0));
  const volTop = H - BOTTOM - VOL;

  const first = data[0], last = data[data.length - 1];
  const cur   = hover !== null ? data[hover] : last;
  const base  = first.open;
  const chg   = cur.close - base;
  const pct   = base > 0 ? (chg / base) * 100 : 0;
  const up    = chg >= 0;
  const color = up ? UP : DOWN;

  const decimals = yMax - yMin < 20 ? 2 : 0;
  const ticks = Array.from({ length: 4 }, (_, i) => yMin + ((yMax - yMin) * (i + 0.5)) / 4);

  const linePath = data.map((c, i) => `${i ? "L" : "M"}${x(i)},${y(c.close)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${TOP + priceH} L${x(0)},${TOP + priceH} Z`;

  const pick = (clientX: number, rect: DOMRect) => {
    const i = Math.floor((clientX - rect.left) / step);
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  const xLabels = data.length <= 3
    ? data.map((c, i) => ({ i, t: c.t }))
    : [0, Math.floor((data.length - 1) / 2), data.length - 1].map(i => ({ i, t: data[i].t }));

  return (
    <div ref={wrapRef} className="w-full select-none">
      {/* Header — price + change, follows the cursor */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-white tabular-nums">{money(cur.close)}</p>
          <p className="text-sm font-medium mt-1 tabular-nums" style={{ color }}>
            {up ? "+" : "−"}{money(Math.abs(chg))} ({up ? "+" : "−"}{Math.abs(pct).toFixed(2)}%)
            <span className="ml-2 font-normal" style={{ color: MUTED }}>
              {hover !== null ? day(cur.t, { weekday: "short", month: "short", day: "numeric" }) : range === "1W" ? "Past week" : "Past 2 weeks"}
            </span>
          </p>
          {mode === "candle" && hover !== null && (
            <p className="text-xs mt-1 tabular-nums" style={{ color: MUTED }}>
              O {money(cur.open)} · H {money(cur.high)} · L {money(cur.low)} · C {money(cur.close)}
              {cur.volume ? ` · ${cur.volume} new listing${cur.volume === 1 ? "" : "s"}` : ""}
            </p>
          )}
        </div>
        <div className="flex rounded-full p-0.5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          {(["candle", "line"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition"
              style={{ backgroundColor: mode === m ? "rgba(255,255,255,0.14)" : "transparent", color: mode === m ? "#fff" : MUTED }}>
              {m === "candle" ? "Candles" : "Line"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <svg width={width} height={H} className="block touch-none"
        onMouseMove={e => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => setHover(null)}
        onTouchStart={e => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={e => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="cc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Price scale (right) */}
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke={LINE} />
            <text x={plotW + 8} y={y(v) + 4} fontSize="11" fill={MUTED} className="tabular-nums">
              ${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            </text>
          </g>
        ))}

        {/* Starting-price reference (dotted) */}
        <line x1={0} x2={plotW} y1={y(base)} y2={y(base)} stroke={MUTED} strokeOpacity="0.5" strokeDasharray="2 4" />

        {/* Series */}
        {mode === "line" ? (
          <>
            <path d={areaPath} fill="url(#cc-area)" />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          </>
        ) : data.map((c, i) => {
          const green = c.close >= c.open;
          const col   = green ? UP : DOWN;
          const top   = y(Math.max(c.open, c.close));
          const h     = Math.max(1.5, Math.abs(y(c.open) - y(c.close)));
          return (
            <g key={c.t} opacity={hover === null || hover === i ? 1 : 0.45}>
              <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={col} strokeWidth="1.3" />
              <rect x={x(i) - bodyW / 2} y={top} width={bodyW} height={h} rx="1.5" fill={col} />
            </g>
          );
        })}

        {/* Volume = new listings that day */}
        {data.map((c, i) => {
          const v = c.volume ?? 0;
          if (!v) return null;
          const h = (v / maxVol) * (VOL - 6);
          return <rect key={`v${c.t}`} x={x(i) - bodyW / 2} y={volTop + VOL - h} width={bodyW} height={h} rx="1"
            fill={c.close >= c.open ? UP : DOWN} opacity={hover === null || hover === i ? 0.35 : 0.15} />;
        })}

        {/* Crosshair */}
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={TOP} y2={H - BOTTOM} stroke="rgba(255,255,255,0.35)" />
            {mode === "line" && <circle cx={x(hover)} cy={y(cur.close)} r="4.5" fill={color} stroke="#000" strokeWidth="1.5" />}
          </>
        )}

        {/* Dates */}
        {xLabels.map(({ i, t }) => (
          <text key={`x${i}`} x={x(i)} y={H - 8} fontSize="11" fill={MUTED} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>
            {day(t)}
          </text>
        ))}
      </svg>

      {/* Range tabs */}
      <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: `1px solid ${LINE}` }}>
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className="px-3 py-1.5 text-xs font-bold rounded-md transition"
            style={{ color: range === r.key ? color : MUTED, backgroundColor: range === r.key ? `${color}1A` : "transparent" }}>
            {r.key}
          </button>
        ))}
        <span className="ml-auto text-[11px]" style={{ color: MUTED }}>eBay PSA 10 asking prices · not sold prices</span>
      </div>
    </div>
  );
}
