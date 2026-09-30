// ─── app/api/cards/listings/[id]/sold/route.ts ───────────────────────────────
// Marks a listing sold ONLY after verifying the USDC payment on Base:
// successful tx, official USDC contract, paid to the listing's seller wallet,
// at least the listing price, listing not already sold, tx not reused.
import { createPublicClient, http, type Hex, type TransactionReceipt } from "viem";
import { base, baseSepolia } from "viem/chains";
import { checkRateLimit } from "@/lib/ratelimit";
import { supabaseAdmin }  from "@/lib/supabase-server";
import { markSold }       from "@/lib/listings";

export const dynamic = "force-dynamic";

const TX_HASH_REGEX    = /^0x[a-fA-F0-9]{64}$/;
const LISTING_ID_REGEX = /^lst_\d+$/;
const TRANSFER_TOPIC   = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// Official USDC contracts
const USDC = {
  base:        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  baseSepolia: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
};

async function findReceipt(hash: Hex): Promise<{ receipt: TransactionReceipt; usdc: string } | null> {
  for (const [chain, usdc] of [[base, USDC.base], [baseSepolia, USDC.baseSepolia]] as const) {
    try {
      const client  = createPublicClient({ chain, transport: http() });
      const receipt = await client.getTransactionReceipt({ hash });
      if (receipt) return { receipt, usdc };
    } catch { /* not on this chain */ }
  }
  return null;
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const { id } = await context.params;
  if (!id || !LISTING_ID_REGEX.test(id)) return Response.json({ error: "Invalid listing ID" }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const txHash = String(body?.txHash ?? "");
  if (!TX_HASH_REGEX.test(txHash)) return Response.json({ error: "Invalid transaction hash" }, { status: 400 });

  // Listing must exist and not already be sold
  const { data: listing } = await supabaseAdmin.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status === "sold" || listing.sold === true || listing.tx_hash) {
    return Response.json({ error: "This card has already been sold." }, { status: 409 });
  }

  // Same payment can't be used twice
  const { data: reused } = await supabaseAdmin.from("listings").select("id").eq("tx_hash", txHash).limit(1);
  if (reused && reused.length) return Response.json({ error: "This payment was already used." }, { status: 409 });

  const seller   = String(listing.seller_wallet ?? listing.sellerWallet ?? "").toLowerCase();
  const priceUsd = Number(listing.price_usd ?? listing.priceUSD ?? 0);
  if (!/^0x[a-f0-9]{40}$/.test(seller) || !(priceUsd > 0)) {
    return Response.json({ error: "Listing is missing a seller wallet or price." }, { status: 400 });
  }

  // Verify on-chain
  const found = await findReceipt(txHash as Hex);
  if (!found) return Response.json({ error: "Transaction not found on Base yet. Please try again in a moment." }, { status: 404 });
  const { receipt, usdc } = found;
  if (receipt.status !== "success") return Response.json({ error: "The payment transaction failed." }, { status: 400 });

  let paid = BigInt(0);
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdc || log.topics[0] !== TRANSFER_TOPIC || !log.topics[2]) continue;
    const to = ("0x" + log.topics[2].slice(26)).toLowerCase();
    if (to === seller) paid += BigInt(log.data);
  }
  const required = BigInt(Math.round(priceUsd * 1_000_000));   // USDC has 6 decimals
  if (paid < required) {
    return Response.json({ error: "Payment doesn't match this listing (wrong amount or recipient)." }, { status: 400 });
  }

  try {
    await markSold(id, txHash);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to mark listing as sold" }, { status: 500 });
  }
}
