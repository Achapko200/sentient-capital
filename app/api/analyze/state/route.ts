import { NextResponse } from "next/server";

let lastState = {
  insight: "initializing...",
  riskScore: 0,
  decision: "HOLD",
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(lastState);
}