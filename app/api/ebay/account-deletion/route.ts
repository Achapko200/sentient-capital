// eBay Marketplace Account Deletion notifications (required by eBay for API access).
// Card Tracker stores no eBay user data (only public listing prices), so there is nothing to delete;
// we verify the endpoint and acknowledge each notice.
import { createHash } from "crypto";

export const dynamic = "force-dynamic";
const ENDPOINT = "https://sentient-capital.vercel.app/api/ebay/account-deletion";

// eBay verification: sha256(challengeCode + verificationToken + endpoint)
export async function GET(req: Request) {
  const challengeCode = new URL(req.url).searchParams.get("challenge_code");
  const token = process.env.EBAY_VERIFICATION_TOKEN;
  if (!challengeCode || !token) return Response.json({ error: "Missing challenge" }, { status: 400 });
  const challengeResponse = createHash("sha256").update(challengeCode).update(token).update(ENDPOINT).digest("hex");
  return Response.json({ challengeResponse });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[ebay] account deletion notice received:", body?.metadata?.topic ?? "", body?.notification?.notificationId ?? "");
  } catch {}
  return new Response(null, { status: 204 });
}
