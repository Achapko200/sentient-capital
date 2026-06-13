"use client";

// ─── StockPanel.tsx ───────────────────────────────────────────────────────────
// Fetches real Finnhub data and keeps fundstore hydrated with live prices.

import { useEffect, useState } from "react";
import { updateAssetPrice }    from "@/lib/fundstore";
import { useFund }             from "@/context/FundContext";

type StockData = {
  symbol:        string;
  price:         number;
  high:          number;
  low:           number;
  open:          number;
  previousClose: number;
};

export default function StockPanel({ symbol }: { symbol: string }) {
  const [data,    setData]    = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const { updateMarket } = useFund();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const load = async () => {
      try {
        setError(false);
        const res  = await fetch(`/api/analyze/stock?symbol=${symbol}`);
        const json = await res.json() as StockData;

        if (!res.ok) throw new Error("fetch failed");

        const prev = data?.price ?? json.previousClose ?? json.price;
        const changePct = prev > 0 ? ((json.price - prev) / prev) * 100 : 0;

        // Hydrate both stores
        updateAssetPrice(symbol, json.price, changePct);
        updateMarket({ symbol, price: json.price, changePct });

        setData(json);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
    interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const changeAmt  = data ? data.price - (data.previousClose ?? data.price) : 0;
  const changePct  = data && data.previousClose ? ((changeAmt / data.previousClose) * 100) : 0;
  const isUp       = changeAmt >= 0;

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-4">
      {loading && !data ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-16 mb-3" />
          <div className="h-8 bg-gray-800 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-800 rounded w-32" />
        </div>
      ) : error ? (
        <div>
          <p className="text-white font-bold">{symbol}</p>
          <p className="text-red-400 text-sm mt-1">Finnhub unavailable</p>
          <p className="text-gray-600 text-xs mt-1">Add FINNHUB_API_KEY to .env.local</p>
        </div>
      ) : data ? (
        <>
          <div className="flex justify-between items-start">
            <p className="text-white font-bold">{data.symbol}</p>
            <span className="text-gray-600 text-xs">NASDAQ</span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${isUp ? "text-green-400" : "text-red-400"}`}>
            ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-sm ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{changeAmt.toFixed(2)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%)
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>H: {data.high?.toFixed(2)}</span>
            <span>L: {data.low?.toFixed(2)}</span>
            <span>O: {data.open?.toFixed(2)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
