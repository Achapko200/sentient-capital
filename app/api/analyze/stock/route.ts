import { NextResponse } from "next/server";
import { updateFundState } from "@/lib/fundstore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing symbol" },
      { status: 400 }
    );
  }

  // TEMP MOCK DATA (guaranteed to work)
  const basePrices: Record<string, number> = {
    TSLA: 248.12,
    NVDA: 875.44,
    AAPL: 192.33,
    MSFT: 415.22,
    BTC: 42100,
  };

  const base =
    basePrices[symbol.toUpperCase()] ??
    100 + Math.random() * 200;

  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    price: Number(base.toFixed(2)),
    high: Number((base * 1.02).toFixed(2)),
    low: Number((base * 0.98).toFixed(2)),
  });
}