import { NextResponse }      from "next/server";
import { fetchCryptoPrices } from "@/lib/crypto";

export async function GET() {
  const prices = await fetchCryptoPrices();
  return NextResponse.json({ prices });
}