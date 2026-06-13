"use client";

// ─── FundContext.tsx ──────────────────────────────────────────────────────────
// Global fund state: equity, positions, trades, equity history, drawdown, Sharpe.
// All bugs from the original are fixed here:
//  • addTrade now receives and stores price
//  • markToMarket is called by DecisionEngine on every tick
//  • updateMarket is called by MarketStream on every tick
//  • equityHistory drives the EquityCurve component

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Position, MarketTick } from "@/types";
import { calcDrawdown, calcSharpe, calcUnrealizedPnL, avgEntryPrice } from "@/lib/portfolio";

const STARTING_EQUITY = 1_000_000;

type Trade = {
  id:         number;
  symbol:     string;
  action:     string;
  size:       number;
  price:      number;   // ← always present now
  time:       string;
};

type FundState = {
  cash:          number;
  equity:        number;
  pnl:           number;
  trades:        Trade[];
  positions:     Record<string, Position>;
  market:        Record<string, MarketTick>;
  equityHistory: { equity: number; time: string }[];
  drawdown:      number;
  sharpe:        number;
  tradeCount:    number;

  addTrade:     (trade: Trade) => void;
  updateMarket: (tick: MarketTick) => void;
  markToMarket: () => void;
};

const FundContext = createContext<FundState | null>(null);

export function FundProvider({ children }: { children: ReactNode }) {
  const [trades,    setTrades]    = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [market,    setMarket]    = useState<Record<string, MarketTick>>({});
  const [equity,    setEquity]    = useState(STARTING_EQUITY);
  const [pnl,       setPnL]       = useState(0);
  const [drawdown,  setDrawdown]  = useState(0);
  const [sharpe,    setSharpe]    = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [equityHistory, setEquityHistory] = useState<{ equity: number; time: string }[]>([
    { equity: STARTING_EQUITY, time: new Date().toLocaleTimeString() },
  ]);

  // ── addTrade ──────────────────────────────────────────────────────────────
  const addTrade = useCallback((trade: Trade) => {
    setTrades((prev) => [trade, ...prev].slice(0, 50));
    setTradeCount((n) => n + 1);

    setPositions((prev) => {
      const existing = prev[trade.symbol];
      const price    = trade.price;

      if (trade.action === "SELL") {
        // Reduce or close position
        const newSize = Math.max(0, (existing?.size ?? 0) - trade.size);
        if (newSize === 0) {
          const next = { ...prev };
          delete next[trade.symbol];
          return next;
        }
        return {
          ...prev,
          [trade.symbol]: {
            ...existing!,
            size: newSize,
          },
        };
      }

      // BUY or HEDGE — average in
      const newSize  = (existing?.size ?? 0) + trade.size;
      const newEntry = avgEntryPrice(existing, price, trade.size);

      return {
        ...prev,
        [trade.symbol]: {
          symbol:        trade.symbol,
          size:          newSize,
          entryPrice:    newEntry,
          currentPrice:  price,
          unrealizedPnL: existing?.unrealizedPnL ?? 0,
        },
      };
    });
  }, []);

  // ── updateMarket ──────────────────────────────────────────────────────────
  const updateMarket = useCallback((tick: MarketTick) => {
    setMarket((prev) => ({
      ...prev,
      [tick.symbol]: tick,
    }));
  }, []);

  // ── markToMarket ──────────────────────────────────────────────────────────
  // Called by DecisionEngine on every 2s tick.
  const markToMarket = useCallback(() => {
    setPositions((prevPositions) => {
      const updated = { ...prevPositions };
      let totalPnL = 0;

      for (const sym of Object.keys(updated)) {
        // We read market directly from the closure — it's always fresh
        // because updateMarket is called by MarketStream before this.
        setMarket((prevMarket) => {
          const tick         = prevMarket[sym];
          const currentPrice = tick?.price ?? updated[sym].currentPrice;
          const unrealizedPnL = calcUnrealizedPnL(updated[sym], currentPrice);

          updated[sym] = {
            ...updated[sym],
            currentPrice,
            unrealizedPnL,
          };

          totalPnL += unrealizedPnL;
          return prevMarket; // no change to market state
        });
      }

      const newEquity = STARTING_EQUITY + totalPnL;
      setPnL(totalPnL);
      setEquity(newEquity);

      setEquityHistory((prev) => {
        const next = [
          ...prev,
          { equity: newEquity, time: new Date().toLocaleTimeString() },
        ].slice(-200);

        setDrawdown(calcDrawdown(next.map((p) => p.equity)));
        setSharpe(calcSharpe(next.map((p) => p.equity)));

        return next;
      });

      return updated;
    });
  }, []);

  return (
    <FundContext.Provider
      value={{
        cash: STARTING_EQUITY,
        equity,
        pnl,
        trades,
        positions,
        market,
        equityHistory,
        drawdown,
        sharpe,
        tradeCount,
        addTrade,
        updateMarket,
        markToMarket,
      }}
    >
      {children}
    </FundContext.Provider>
  );
}

export function useFund(): FundState {
  const ctx = useContext(FundContext);
  if (!ctx) throw new Error("useFund must be used within <FundProvider>");
  return ctx;
}
