"use client";

import { useEffect, useState } from "react";
import { StrategyEngine } from "@/lib/StrategyEngine";

type Execution = {
  id: number;
  symbol: string;
  action: string;
  size: number;
  confidence: number;
  reason: string;
  time: string;
};

export default function ExecutionLog() {
  const [executions, setExecutions] = useState<Execution[]>([]);

  // Mock market data stream
  const marketData = [
    { symbol: "NVDA", price: 142.3, changePct: 1.8 },
    { symbol: "TSLA", price: 248.1, changePct: -2.1 },
    { symbol: "SPY", price: 512.4, changePct: 0.3 },
  ];

  // Mock AI insights (this will later come from InsightsPanel)
  const insights = [
    { symbol: "NVDA", sentiment: "BULLISH", confidence: 82 },
    { symbol: "TSLA", sentiment: "BEARISH", confidence: 77 },
    { symbol: "SPY", sentiment: "NEUTRAL", confidence: 55 },
  ] as const;

  useEffect(() => {
    const interval = setInterval(() => {

      // pick random asset each cycle
      const randomIndex = Math.floor(Math.random() * marketData.length);

      const market = marketData[randomIndex];
      const insight = insights[randomIndex];

      // run strategy engine
      const decision = StrategyEngine.generateDecision(
        market,
        insight
      );

      // ignore HOLD trades (optional realism)
      if (decision.action === "HOLD") return;

      const newExecution: Execution = {
        id: Date.now(),
        symbol: decision.symbol,
        action: decision.action,
        size: decision.size,
        confidence: decision.confidence,
        reason: decision.reason,
        time: new Date().toLocaleTimeString(),
      };

      setExecutions((prev) => [newExecution, ...prev].slice(0, 20));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 mt-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Execution Engine
          </h2>
          <p className="text-sm text-gray-400">
            Live AI-generated trades (Strategy Engine output)
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm animate-pulse">
          AI TRADING ACTIVE
        </div>

      </div>

      {/* Table */}
      <div className="space-y-3">

        {executions.length === 0 && (
          <p className="text-gray-500 text-sm">
            Waiting for strategy signals...
          </p>
        )}

        {executions.map((trade) => (
          <div
            key={trade.id}
            className="p-4 rounded-lg bg-white/5 border border-gray-800"
          >

            <div className="flex justify-between items-start">

              <div>
                <p className="text-white font-semibold">
                  {trade.symbol} — {trade.action}
                </p>

                <p className="text-gray-400 text-sm mt-1">
                  {trade.reason}
                </p>
              </div>

              <div className="text-right">

                <p className="text-white">
                  {trade.size}% position
                </p>

                <p className="text-sm text-gray-400">
                  Conf: {trade.confidence}%
                </p>

              </div>

            </div>

            <p className="text-xs text-gray-500 mt-2">
              {trade.time}
            </p>

          </div>
        ))}

      </div>
    </div>
  );
}