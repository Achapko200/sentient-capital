"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Trade = {
  id: number;
  symbol: string;
  action: string;
  size: number;
  price: number;
  time: string;
};

type MarketTick = {
  symbol: string;
  price: number;
  changePct: number;
};

type Position = {
  symbol: string;
  size: number;
  entryPrice: number;
  unrealizedPnL: number;
};

type FundState = {
  cash: number;
  equity: number;
  pnl: number;
  trades: Trade[];
  positions: Record<string, Position>;
  market: Record<string, MarketTick>;
  agentStats: {
    Macro: { correct: number; total: number };
    Quant: { correct: number; total: number };
    Risk: { correct: number; total: number };
    News: { correct: number; total: number };
  };

  equityHistory: number[];
  drawdown: number;

  addTrade: (trade: Trade) => void;
  updateMarket: (tick: MarketTick) => void;
  updateAgentStats: (
    agent: "Macro" | "Quant" | "Risk" | "News",
    wasRight: boolean
  ) => void;
  markToMarket: () => void;
};

const FundContext = createContext<FundState | null>(null);

export function FundProvider({ children }: { children: ReactNode }) {
  const [cash] = useState(1000000);
  const [equity, setEquity] = useState(1000000);
  const [pnl, setPnL] = useState(0);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [market, setMarket] = useState<Record<string, MarketTick>>({});
  const [agentStats, setAgentStats] = useState({
  Macro: {
    correct: 0,
    total: 0,
  },
  Quant: {
    correct: 0,
    total: 0,
  },
  Risk: {
    correct: 0,
    total: 0,
  },
  News: {
    correct: 0,
    total: 0,
  },
});


  const [agentStats, setAgentStats] = useState({
    Macro: {
      correct: 0,
      total: 0,
    },
    Quant: {
      correct: 0,
      total: 0,
    },
    Risk: {
      correct: 0,
      total: 0,
    },
    News: {
      correct: 0,
      total: 0,
    },
  });


  const [equityHistory, setEquityHistory] = useState<number[]>([]);
  const [drawdown, setDrawdown] = useState(0);

  // 🧠 TRADE EXECUTION
  const addTrade = (trade: Trade) => {
    setTrades((prev) => [trade, ...prev].slice(0, 50));

    setPositions((prev) => {
      const existing = prev[trade.symbol];
      const price = trade.price;

      let updated: Position;

      if (existing) {
        const newSize = existing.size + trade.size;

        const avgPrice =
          (existing.entryPrice * existing.size +
            price * trade.size) /
          newSize;

        updated = {
          symbol: trade.symbol,
          size: newSize,
          entryPrice: avgPrice,
          unrealizedPnL: existing.unrealizedPnL,
        };
      } else {
        updated = {
          symbol: trade.symbol,
          size: trade.size,
          entryPrice: price,
          unrealizedPnL: 0,
        };
      }

      return {
        ...prev,
        [trade.symbol]: updated,
      };
    });
  };

  // 📡 MARKET UPDATE
  const updateMarket = (tick: MarketTick) => {
    setMarket((prev) => ({
      ...prev,
      [tick.symbol]: tick,
    }));
  };
  const updateAgentStats = (
    agent: "Macro" | "Quant" | "Risk" | "News",
    wasRight: boolean
  ) => {

    setAgentStats((prev) => {

      const current = prev[agent];

      return {
        ...prev,

        [agent]: {
          correct:
            current.correct + (wasRight ? 1 : 0),

          total:
            current.total + 1,
        },

      };

    });

  };
  // 📊 MARK TO MARKET ENGINE
  const markToMarket = () => {
    let totalPnL = 0;

    setPositions((prev) => {
      const updated = { ...prev };

      Object.values(updated).forEach((pos) => {
        const currentPrice = market[pos.symbol]?.price;
        if (!currentPrice) return;

        const unrealized =
          (currentPrice - pos.entryPrice) * pos.size;

        updated[pos.symbol] = {
          ...pos,
          unrealizedPnL: unrealized,
        };

        totalPnL += unrealized;
      });

      const newEquity = 1000000 + totalPnL;

      setPnL(totalPnL);
      setEquity(newEquity);

      // 📈 EQUITY HISTORY (FIXED)
      setEquityHistory((prev) => {
        const updatedHistory = [...prev, newEquity].slice(-200);
        return updatedHistory;
      });

      // 📉 DRAWDOWN (FIXED SAFE VERSION)
      setDrawdown((prev) => {
        const history = [...equityHistory, newEquity];
        const peak = Math.max(...history);
        const dd = ((peak - newEquity) / peak) * 100;
        return dd;
      });

      return updated;
    });
  };

  return (
    <FundContext.Provider
      value={{
        cash,
        equity,
        pnl,
        trades,
        positions,
        market,
        agentStats,
        equityHistory,
        drawdown,
        updateAgentStats,
        addTrade,
        updateMarket,
        markToMarket,
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
