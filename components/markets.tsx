"use client";

import { useState } from "react";

type MarketItem = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
};

export default function Markets() {
  const [markets] = useState<MarketItem[]>([
    {
      id: 1,
      symbol: "NVDA",
      name: "NVIDIA",
      price: 142.32,
      change: 3.24,
      changePct: 2.33,
      bias: "BULLISH",
    },
    {
      id: 2,
      symbol: "TSLA",
      name: "Tesla",
      price: 248.11,
      change: -5.67,
      changePct: -2.23,
      bias: "BEARISH",
    },
    {
      id: 3,
      symbol: "SPY",
      name: "S&P 500 ETF",
      price: 512.44,
      change: 1.12,
      changePct: 0.22,
      bias: "NEUTRAL",
    },
    {
      id: 4,
      symbol: "AAPL",
      name: "Apple",
      price: 192.87,
      change: 2.01,
      changePct: 1.05,
      bias: "BULLISH",
    },
    {
      id: 5,
      symbol: "BTC",
      name: "Bitcoin",
      price: 68420,
      change: -820,
      changePct: -1.18,
      bias: "BEARISH",
    },
  ]);

  const getBiasColor = (bias: MarketItem["bias"]) => {
    switch (bias) {
      case "BULLISH":
        return "text-green-400";
      case "BEARISH":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 mt-6">

      <div className="flex justify-between items-center mb-5">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Market Overview
          </h2>
          <p className="text-sm text-gray-400">
            Live price action & AI bias signals
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">
          Market Scanner Active
        </div>

      </div>

      <div className="space-y-3">

        {markets.map((m) => (
          <div
            key={m.id}
            className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-gray-800 hover:bg-white/10 transition"
          >

            <div>
              <div className="flex items-center gap-3">

                <span className="text-white font-semibold">
                  {m.symbol}
                </span>

                <span className="text-gray-400 text-sm">
                  {m.name}
                </span>

              </div>

              <p className="text-xs text-gray-500 mt-1">
                AI-driven sentiment + flow analysis
              </p>
            </div>

            <div className="text-right">

              <p className="text-white font-medium">
                ${m.price.toLocaleString()}
              </p>

              <p className={`text-sm ${m.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {m.change >= 0 ? "+" : ""}
                {m.change} ({m.changePct}%)
              </p>

            </div>

            <div className="ml-6">

              <span className={`text-sm font-semibold ${getBiasColor(m.bias)}`}>
                {m.bias}
              </span>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}