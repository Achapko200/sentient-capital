// ─── lib/cardToken.ts ────────────────────────────────────────────────────────

import type { MLBStats } from "@/lib/cardTypes";

export type CardToken = {
  id:            string;
  playerId:      string;
  playerName:    string;
  cardName:      string;
  totalShares:   number;
  pricePerShare: number;
  askPrice:      number | null;
  bidPrice:      number | null;
  volume24h:     number;
  changePct24h:  number;
  psaCert:       string;
  vaultStatus:   "VERIFIED" | "PENDING" | "REDEEMED";
  cardImage:     string;
  teamColor:     string;
  cardColor:     string;
};

export type Candle = {
  time:   string;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
};

// ─── Price a card token from MLB stats ───────────────────────────────────────
// Base price per share = card market value / 100 shares
export function priceFromStats(stats: MLBStats | null, baseCardPrice: number): number {
  if (!stats) return baseCardPrice / 100;

  let multiplier = 1.0;
  if (stats.ops >= 0.950) multiplier += 0.25;
  else if (stats.ops >= 0.850) multiplier += 0.12;
  else if (stats.ops < 0.650) multiplier -= 0.15;

  if (stats.hr >= 25) multiplier += 0.15;
  else if (stats.hr >= 15) multiplier += 0.08;

  if (stats.lastGame?.hr && stats.lastGame.hr >= 1) multiplier += 0.05;
  if (stats.lastGame?.hits === 0) multiplier -= 0.03;

  const cardPrice = Math.round(baseCardPrice * multiplier);
  return Math.round((cardPrice / 100) * 100) / 100; // price per share
}

// ─── Generate candle history from a base price ───────────────────────────────
export function generateCandles(basePrice: number, days = 30): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice * 0.75; // start lower, trend up

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const volatility = 0.04;
    const drift      = 0.008;
    const change     = price * (drift + (Math.random() - 0.45) * volatility);

    const open  = price;
    const close = Math.round((price + change) * 100) / 100;
    const high  = Math.round(Math.max(open, close) * (1 + Math.random() * 0.02) * 100) / 100;
    const low   = Math.round(Math.min(open, close) * (1 - Math.random() * 0.02) * 100) / 100;

    candles.push({
      time:   date.toISOString().split("T")[0],
      open:   Math.round(open * 100) / 100,
      high,
      low,
      close,
      volume: Math.round(Math.random() * 500 + 100),
    });

    price = close;
  }
  return candles;
}