import { NextResponse } from "next/server";
import { getListings, addListing } from "@/lib/listings";

export async function GET() {
  return NextResponse.json({ listings: getListings() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const listing = addListing(body);
  return NextResponse.json({ listing });
}