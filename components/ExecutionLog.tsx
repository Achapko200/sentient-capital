"use client";

import { useEffect, useState } from "react";
import { FundEngine } from "@/lib/FundEngine";
import { useFund } from "@/context/FundContext";

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
  const { addTrade } = useFund();

  useEffect(() => {
    const engine = new FundEngine();

    engine.start((trade) => {

      // 1. UI state (execution feed)
      setExecutions((prev) => [
        {
          id: trade.id,
          symbol: trade.symbol,
          action: trade.action,
          size: trade.size,
          confidence: trade.confidence,
          reason: trade.reason,
          time: trade.time,
        },
        ...prev,
      ].slice(0, 25));

      // 2. GLOBAL FUND STATE UPDATE
      addTrade({
        id: trade.id,
        symbol: trade.symbol,
        action: trade.action,
        size: trade.size,
        time: trade.time,
      });

    });

    return () => engine.stop();
  }, [addTrade]);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 mt-6">

      <div className="flex justify-between items-center mb-5">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Execution Engine
          </h2>
          <p className="text-sm text-gray-400">
            Live AI-generated trades (Fund-connected)
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm animate-pulse">
          FUND CONNECTED
        </div>

      </div>

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