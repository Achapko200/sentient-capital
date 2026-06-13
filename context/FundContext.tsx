"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Trade = {
  id: number;
  symbol: string;
  action: string;
  size: number;
  price?: number;
  pnl?: number;
  time: string;
};

type MarketTick = {
  symbol: string;
  price: number;
  changePct: number;
};

type FundState = {
  cash: number;
  equity: number;
  pnl: number;
  trades: Trade[];
  market: Record<string, MarketTick>;
  addTrade: (trade: Trade) => void;
  updateMarket: (tick: MarketTick) => void;
  updatePnL: (value: number) => void;
};

const FundContext = createContext<FundState | null>(null);

export function FundProvider({ children }: { children: ReactNode }) {
  const [cash] = useState(1000000);
  const [equity, setEquity] = useState(1000000);
  const [pnl, setPnL] = useState(0);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [market, setMarket] = useState<Record<string, MarketTick>>({});

  const addTrade = (trade: Trade) => {
    setTrades((prev) => [trade, ...prev].slice(0, 50));

    // simple PnL simulation
    const impact = (Math.random() - 0.5) * 5000;
    setPnL((prev) => prev + impact);
    setEquity((prev) => prev + impact);
  };

  const updateMarket = (tick: MarketTick) => {
    setMarket((prev) => ({
      ...prev,
      [tick.symbol]: tick,
    }));
  };

  const updatePnL = (value: number) => {
    setPnL(value);
  };

  return (
    <FundContext.Provider
      value={{
        cash,
        equity,
        pnl,
        trades,
        market,
        addTrade,
        updateMarket,
        updatePnL,
      }}
    >
      {children}
    </FundContext.Provider>
  );
}

export function useFund() {
  const context = useContext(FundContext);
  if (!context) {
    throw new Error("useFund must be used within FundProvider");
  }
  return context;
}
