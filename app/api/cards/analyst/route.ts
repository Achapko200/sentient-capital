import { NextResponse }    from "next/server";
import { getAllAnalyses }  from "@/lib/analyst";

export async function GET() {
  return NextResponse.json({ analyses: getAllAnalyses() });
}