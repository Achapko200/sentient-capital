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

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${process.env.FINNHUB_API_KEY}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || data.c === undefined) {
      throw new Error("Failed to fetch quote");
    }

    updateFundState({
      symbol: symbol.toUpperCase(),
      price: data.c,
    });

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: data.c,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch stock data",
      },
      { status: 500 }
    );
  }
}