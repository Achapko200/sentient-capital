"use client";

import { useFund } from "@/context/FundContext";

export default function PortfolioCard() {
  const { equity, pnl, drawdown, positions } = useFund();

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6">
      
      <h2 className="text-white text-xl font-semibold mb-4">
        Portfolio Overview
      </h2>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Equity</p>
          <p className="text-white text-lg font-bold">
            ${equity.toFixed(2)}
          </p>
        </div>

        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">PnL</p>
          <p className={`text-lg font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${pnl.toFixed(2)}
          </p>
        </div>

        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Drawdown</p>
          <p className="text-red-400 text-lg font-bold">
            {drawdown.toFixed(2)}%
          </p>
        </div>

      </div>

      {/* Positions */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          Positions
        </h3>

        <div className="space-y-2">
          {Object.values(positions).length === 0 && (
            <p className="text-gray-500 text-sm">
              No open positions
            </p>
          )}

          {Object.values(positions).map((pos) => (
            <div
              key={pos.symbol}
              className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">
                  {pos.symbol}
                </p>
                <p className="text-gray-400 text-xs">
                  Entry: ${pos.entryPrice.toFixed(2)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-white">
                  Size: {pos.size}
                </p>
                <p
                  className={`text-sm ${
                    pos.unrealizedPnL >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  ${pos.unrealizedPnL.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
s