// ─── portfolio.ts ────────────────────────────────────────────────────────────
// Pure portfolio math helpers used by FundContext.

import type { Position } from "@/types";

export function calcUnrealizedPnL(pos: Position, currentPrice: number): number {
  return (currentPrice - pos.entryPrice) * pos.size;
}

export function calcDrawdown(equityHistory: number[]): number {
  if (equityHistory.length < 2) return 0;
  const peak = Math.max(...equityHistory);
  const latest = equityHistory[equityHistory.length - 1];
  if (peak === 0) return 0;
  return ((peak - latest) / peak) * 100;
}

export function calcSharpe(equityHistory: number[], riskFreeRate: number = 0.05): number {
  if (equityHistory.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < equityHistory.length; i++) {
    returns.push((equityHistory[i] - equityHistory[i - 1]) / equityHistory[i - 1]);
  }

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev     = Math.sqrt(
    returns.reduce((a, b) => a + (b - meanReturn) ** 2, 0) / returns.length
  );

  if (stdDev === 0) return 0;

  // Annualized (assuming 252 trading days, ~390 ticks/day at 2s intervals)
  const annualFactor = Math.sqrt(252);
  return ((meanReturn - riskFreeRate / 252) / stdDev) * annualFactor;
}

export function avgEntryPrice(
  existing: Position | undefined,
  newPrice: number,
  newSize: number,
): number {
  if (!existing || existing.size === 0) return newPrice;
  const totalSize = existing.size + newSize;
  return (existing.entryPrice * existing.size + newPrice * newSize) / totalSize;
}
