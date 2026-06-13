"use client";

import { useState } from "react";

type Insight = {
  id: number;
  source: string;
  headline: string;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  summary: string;
  time: string;
};

export default function InsightsPanel() {
  const [insights] = useState<Insight[]>([
    {
      id: 1,
      source: "Macro Agent",
      headline: "Fed rate cut probability increasing",
      signal: "BULLISH",
      confidence: 78,
      summary:
        "Bond market pricing in higher odds of rate cuts within 3 months, supporting equity risk-on sentiment.",
      time: "10:12 AM",
    },
    {
      id: 2,
      source: "Quant News Engine",
      headline: "NVDA momentum anomaly detected",
      signal: "BULLISH",
      confidence: 84,
      summary:
        "Unusual volume + volatility compression breakout pattern forming across 5m–1h timeframe.",
      time: "10:18 AM",
    },
    {
      id: 3,
      source: "Risk Agent",
      headline: "Portfolio exposure rising in tech sector",
      signal: "BEARISH",
      confidence: 66,
      summary:
        "Tech beta exposure exceeds threshold; hedging recommendation triggered via SPY puts.",
      time: "10:26 AM",
    },
    {
      id: 4,
      source: "Sentiment Model",
      headline: "Retail sentiment overheated on TSLA",
      signal: "NEUTRAL",
      confidence: 71,
      summary:
        "Social sentiment spike detected but not confirmed by institutional flow.",
      time: "10:33 AM",
    },
  ]);

  const getColor = (signal: Insight["signal"]) => {
    switch (signal) {
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
            AI Market Insights
          </h2>
          <p className="text-sm text-gray-400">
            Real-time signals from agent swarm
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
          Live Intelligence Feed
        </div>

      </div>

      <div className="space-y-4">

        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-lg bg-white/5 border border-gray-800 hover:bg-white/10 transition"
          >

            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-gray-400">{insight.source}</p>
                <h3 className="text-white font-medium">
                  {insight.headline}
                </h3>
              </div>

              <span className={`text-sm font-semibold ${getColor(insight.signal)}`}>
                {insight.signal}
              </span>

            </div>

            <p className="text-gray-400 text-sm mt-2">
              {insight.summary}
            </p>

            <div className="flex justify-between mt-3 text-xs text-gray-500">

              <span>Confidence: {insight.confidence}%</span>
              <span>{insight.time}</span>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}