import { NextResponse } from "next/server";
import { markSold }     from "@/lib/listings";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id }     = await context.params;
  const { txHash } = await req.json();
  markSold(id, txHash);
  return NextResponse.json({ ok: true });
}