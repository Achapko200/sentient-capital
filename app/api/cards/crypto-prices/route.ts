import { NextResponse }      from "next/server";
import { fetchCryptoPrices } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;
  try {
    const prices = await fetchCryptoPrices();
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: [] }, { status: 500 });
  }
}