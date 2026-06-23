// ─── app/api/cards/listings/[id]/sold/route.ts ───────────────────────────────
import { markSold } from "@/lib/listings";

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const LISTING_ID_REGEX = /^lst_\d+$/;

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Validate listing ID format
  if (!id || !LISTING_ID_REGEX.test(id)) {
    return Response.json({ error: "Invalid listing ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { txHash, buyerWallet } = body as { txHash?: string; buyerWallet?: string };

  // Validate tx hash — must be a real Ethereum tx hash
  if (!txHash || !TX_HASH_REGEX.test(txHash)) {
    return Response.json({ error: "Invalid transaction hash" }, { status: 400 });
  }

  // Validate buyer wallet if provided
  if (buyerWallet && !/^0x[a-fA-F0-9]{40}$/.test(buyerWallet)) {
    return Response.json({ error: "Invalid buyer wallet" }, { status: 400 });
  }

  try {
    await markSold(id, txHash);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to mark listing as sold" }, { status: 500 });
  }
}