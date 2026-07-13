export async function POST(req: Request) {
  // eBay marketplace account deletion notification endpoint
  const body = await req.json().catch(() => ({}));
  console.log("eBay deletion notification:", body);
  // In production: delete user data associated with the eBay user
  return Response.json({ acknowledged: true });
}

export async function GET(req: Request) {
  // eBay verification challenge
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge_code");
  if (challenge) {
    return Response.json({ challengeResponse: challenge });
  }
  return Response.json({ status: "ok" });
}
