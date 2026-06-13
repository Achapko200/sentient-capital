"use client";

import { useEffect, useState } from "react";

type StreamTick = {
  id: number;
  symbol: string;
  price: number;
  change: number;
  time: string;
};

const initialData: StreamTick[] = [
  { id: 1, symbol: "NVDA", price: 142.10, change: 0.12, time: "LIVE" },
  { id: 2, symbol: "TSLA", price: 248.50, change: -0.45, time: "LIVE" },
  { id: 3, symbol: "SPY", price: 512.00, change: 0.08, time: "LIVE" },
  { id: 4, symbol: "AAPL", price: 192.30, change: 0.22, time: "LIVE" },
  { id: 5, symbol: "BTC", price: 68400, change: -12.4, time: "LIVE" },
];

export default function MarketStream() {
  const [stream, setStream] = useState<StreamTick[]>(initialData);

  // simulate live tick updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStream((prev) =>
        prev.map((item) => {
          const volatility = item.symbol === "BTC" ? 5 : 0.5;

          const randomMove =
            (Math.random() - 0.5) * volatility;

          const newPrice = Number((item.price + randomMove).toFixed(2));

          const change = Number((newPrice - item.price).toFixed(2));

          return {
            ...item,
            price: newPrice,
            change,
            time: "LIVE",
          };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 mt-6">

      <div className="flex justify-between items-center mb-4">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Market Stream
          </h2>
          <p className="text-sm text-gray-400">
            Real-time tick data simulation
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm animate-pulse">
          ● LIVE FEED
        </div>

      </div>

      <div className="space-y-3">

        {stream.map((tick) => (
          <div
            key={tick.id}
            className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-gray-800"
          >

            <div className="flex items-center gap-4">

              <span className="text-white font-semibold w-14">
                {tick.symbol}
              </span>

              <span className="text-gray-400 text-sm">
                {tick.time}
              </span>

            </div>

            <div className="text-right">

              <p className="text-white font-medium">
                ${tick.price.toLocaleString()}
              </p>

              <p
                className={`text-sm ${
                  tick.change >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {tick.change >= 0 ? "+" : ""}
                {tick.change}
              </p>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}