import crypto from "crypto";

const VERIFICATION_TOKEN = "ctebayverify2025token12345678901";

export async function POST(req: Request) {
  return new Response("", { status: 200 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challengeCode = searchParams.get("challenge_code");
  
  if (challengeCode) {
    // eBay requires: SHA-256(challengeCode + verificationToken + endpoint)
    const endpoint = "https://sentient-capital.vercel.app/api/ebay/deletion";
    const hash = crypto
      .createHash("sha256")
      .update(challengeCode + VERIFICATION_TOKEN + endpoint)
      .digest("hex");
    
    return Response.json({ challengeResponse: hash });
  }
  
  return new Response("OK", { status: 200 });
}
