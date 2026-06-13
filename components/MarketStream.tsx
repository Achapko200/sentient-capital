"use client";

import { useEffect, useState } from "react";
import { updateAssetPrice }    from "@/lib/fundstore";
import { useFund }             from "@/context/FundContext";

type Tick = {
  symbol:    string;
  price:     number;
  change:    number;
  changePct: number;
};

const SEEDS: Tick[] = [
  { symbol: "NVDA", price: 142.10, change: 0, changePct: 0 },
  { symbol: "TSLA", price: 248.50, change: 0, changePct: 0 },
  { symbol: "SPY",  price: 512.00, change: 0, changePct: 0 },
  { symbol: "AAPL", price: 192.30, change: 0, changePct: 0 },
  { symbol: "BTC",  price: 68400,  change: 0, changePct: 0 },
];

const VOLATILITY: Record<string, number> = {
  BTC: 60, NVDA: 0.6, TSLA: 0.8, SPY: 0.3, AAPL: 0.4,
};

export default function MarketStream() {
  const [ticks, setTicks] = useState<Tick[]>(SEEDS);
  const { updateMarket }  = useFund();

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks((prev) => {
        const next = prev.map((t) => {
          const vol       = VOLATILITY[t.symbol] ?? 0.5;
          const move      = (Math.random() - 0.5) * vol;
          const newPrice  = Math.max(0.01, Number((t.price + move).toFixed(2)));
          const change    = Number((newPrice - t.price).toFixed(2));
          const changePct = Number(((change / t.price) * 100).toFixed(3));
          return { ...t, price: newPrice, change, changePct };
        });

        setTimeout(() => {
          next.forEach((t) => {
            updateAssetPrice({ symbol: t.symbol, price: t.price });
            updateMarket({ symbol: t.symbol, price: t.price, changePct: t.changePct });
          });
        }, 0);

        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [updateMarket]);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Market Stream</h2>
          <p className="text-sm text-gray-400">Real-time tick simulation</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="space-y-2">
        {ticks.map((tick) => (
          <div key={tick.symbol}
            className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold w-12">{tick.symbol}</span>
              <span className="text-gray-600 text-xs">LIVE</span>
            </div>
            <div className="text-right">
              <p className="text-white font-medium text-sm">
                ${tick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs ${tick.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {tick.change >= 0 ? "+" : ""}{tick.change.toFixed(2)}
                &nbsp;({tick.changePct >= 0 ? "+" : ""}{tick.changePct.toFixed(2)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}