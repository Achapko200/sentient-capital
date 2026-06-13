// ─── app/api/analyze/stock/route.ts ──────────────────────────────────────────

import { NextResponse }      from "next/server";
import { updateAssetPrice }  from "@/lib/fundstore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    // Return mock data so the UI works without a key during development
    const mock = {
      NVDA: { price: 142.32, high: 145.10, low: 140.20, open: 141.00, previousClose: 139.08 },
      TSLA: { price: 248.11, high: 252.30, low: 245.00, open: 246.50, previousClose: 253.78 },
      SPY:  { price: 512.44, high: 514.20, low: 510.80, open: 511.90, previousClose: 511.32 },
      AAPL: { price: 192.87, high: 194.50, low: 191.20, open: 192.00, previousClose: 190.86 },
      BTC:  { price: 68420,  high: 69100,  low: 67800,  open: 68100,  previousClose: 69240  },
    };
    const data = mock[symbol as keyof typeof mock] ?? mock.SPY;
    updateAssetPrice(symbol, data.price, ((data.price - data.previousClose) / data.previousClose) * 100);
    return NextResponse.json({ symbol, ...data });
  }

  try {
    const res  = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { cache: "no-store" },
    );
    const data = await res.json();

    if (!res.ok || data.c == null) throw new Error("Finnhub error");

    const changePct = data.pc > 0 ? ((data.c - data.pc) / data.pc) * 100 : 0;
    updateAssetPrice(symbol, data.c, changePct);

    return NextResponse.json({
      symbol,
      price:         data.c,
      high:          data.h,
      low:           data.l,
      open:          data.o,
      previousClose: data.pc,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}
