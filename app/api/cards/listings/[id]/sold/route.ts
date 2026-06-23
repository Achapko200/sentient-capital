// ─── app/api/cards/listings/[id]/sold/route.ts ───────────────────────────────
import { markSold }       from "@/lib/listings";
import { checkRateLimit } from "@/lib/ratelimit";

const TX_HASH_REGEX  = /^0x[a-fA-F0-9]{64}$/;
const LISTING_ID_REGEX = /^lst_\d+$/;

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const { id } = await context.params;

  if (!id || !LISTING_ID_REGEX.test(id)) {
    return Response.json({ error: "Invalid listing ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { txHash } = body as { txHash?: string };

  if (!txHash || !TX_HASH_REGEX.test(txHash)) {
    return Response.json({ error: "Invalid transaction hash" }, { status: 400 });
  }

  try {
    await markSold(id, txHash);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to mark listing as sold" }, { status: 500 });
  }
}