// ─── app/api/analyze/loop/state/route.ts ─────────────────────────────────────

import { NextResponse }  from "next/server";
import { researchStore } from "@/lib/research";

export async function GET() {
  return NextResponse.json(researchStore.get());
}
