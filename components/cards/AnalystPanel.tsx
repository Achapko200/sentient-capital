"use client";

import { useEffect, useState } from "react";
import type { CardAnalysis }   from "@/lib/analyst";

const RATING_STYLE: Record<string, string> = {
  "STRONG BUY":  "bg-green-100 text-green-700 border-green-200",
  "BUY":         "bg-emerald-50 text-emerald-700 border-emerald-200",
  "HOLD":        "bg-yellow-100 text-yellow-700 border-yellow-200",
  "SELL":        "bg-orange-100 text-orange-700 border-orange-200",
  "STRONG SELL": "bg-red-100 text-red-700 border-red-200",
};

export default function AnalystPanel() {
  const [analyses, setAnalyses] = useState<CardAnalysis[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cards/analysts")
      .then((r) => r.json())
      .then((data) => setAnalyses(data.analyses ?? []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-gray-900 font-black text-base">Analyst Picks</h3>
          <p className="text-gray-400 text-xs mt-0.5">AI-generated from live MLB stats</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
          LIVE
        </span>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {analyses.map((analysis) => (
            <div key={analysis.playerId}>
              <button
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                onClick={() => setExpanded(expanded === analysis.playerId ? null : analysis.playerId)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-sm truncate">{analysis.playerName}</p>
                  <p className="text-gray-400 text-xs">Avg target: ${analysis.avgPriceTarget}</p>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded-full border shrink-0 ${RATING_STYLE[analysis.consensusRating]}`}>
                  {analysis.consensusRating}
                </span>
                <span className="text-gray-300 ml-1">{expanded === analysis.playerId ? "▲" : "▼"}</span>
              </button>

              {expanded === analysis.playerId && (
                <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100 space-y-3 pt-3">
                  {analysis.calls.map((call, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{call.analyst.avatar}</span>
                          <div>
                            <p className="text-gray-900 font-bold text-xs">{call.analyst.name}</p>
                            <p className="text-gray-400 text-xs">{call.analyst.firm}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${RATING_STYLE[call.rating]}`}>
                            {call.rating}
                          </span>
                          <p className="text-gray-500 text-xs mt-1">
                            Target: <span className="font-bold text-gray-900">${call.priceTarget}</span>
                            <span className={`ml-1 ${call.upside >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ({call.upside >= 0 ? "+" : ""}{call.upside}%)
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">{call.thesis}</p>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{call.date}</span>
                        <span>{call.timeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}