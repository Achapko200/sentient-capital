"use client";

import { useEffect, useState } from "react";

type StockData = {
  symbol: string;
  price: number;
  high: number;
  low: number;
};

export default function StockPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/stock?symbol=${symbol}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Stock fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, [symbol]);

  if (loading || !data) {
    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0B1020] text-white">
        Loading {symbol}...
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-[#0B1020]">
      <h2 className="text-white font-bold">{data.symbol}</h2>

      <p className="text-green-400 text-2xl">
        ${data.price}
      </p>

      <div className="text-xs text-slate-400 mt-2">
        High: {data.high} | Low: {data.low}
      </div>
    </div>
  );
}