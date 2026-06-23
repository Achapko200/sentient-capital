import { NextResponse }      from "next/server";
import { fetchCryptoPrices } from "@/lib/crypto";

export async function GET() {
  try {
    const prices = await fetchCryptoPrices();
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: [] }, { status: 500 });
  }
}