export async function POST(req: Request) {
  return new Response("", { status: 200 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge_code");
  if (challenge) {
    return Response.json({ challengeResponse: challenge });
  }
  return new Response("OK", { status: 200 });
}
