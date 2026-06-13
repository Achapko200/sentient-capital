"use client";

import { useState } from "react";

type Portfolio = {
  aum: number;
  pnl: number;
  pnlPct: number;
  exposure: number;
  cash: number;
  leverage: number;
};

export default function PortfolioCard() {
  const [portfolio] = useState<Portfolio>({
    aum: 12450000, // 12.45M
    pnl: 312450,   // daily PnL
    pnlPct: 2.57,
    exposure: 0.68, // 68% deployed
    cash: 0.32,     // 32% cash
    leverage: 1.4,
  });

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 mt-6">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Portfolio Overview
          </h2>
          <p className="text-sm text-gray-400">
            Fund performance & risk metrics
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
          LIVE P&L
        </div>

      </div>

      {/* AUM + PnL */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="p-4 rounded-lg bg-white/5 border border-gray-800">
          <p className="text-gray-400 text-sm">Assets Under Management</p>
          <p className="text-white text-2xl font-semibold mt-1">
            {formatMoney(portfolio.aum)}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-gray-800">
          <p className="text-gray-400 text-sm">Daily P&L</p>
          <p className="text-green-400 text-2xl font-semibold mt-1">
            +{formatMoney(portfolio.pnl)}
          </p>
          <p className="text-green-400 text-sm">
            +{portfolio.pnlPct}%
          </p>
        </div>

      </div>

      {/* Risk Metrics */}
      <div className="space-y-4">

        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Market Exposure</span>
            <span>{Math.round(portfolio.exposure * 100)}%</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${portfolio.exposure * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Cash Position</span>
            <span>{Math.round(portfolio.cash * 100)}%</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400"
              style={{ width: `${portfolio.cash * 100}%` }}
            />
          </div>
        </div>

        {/* Leverage */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-800 mt-4">

          <span className="text-gray-400 text-sm">
            Leverage
          </span>

          <span className="text-white font-semibold">
            {portfolio.leverage}x
          </span>

        </div>

      </div>
    </div>
  );
}