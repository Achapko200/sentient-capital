import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`
  );

  const data = await res.json();

  return NextResponse.json({
    symbol,
    price: data.c,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: Date.now(),
  });
}