// ─── app/api/cards/listings/route.ts ─────────────────────────────────────────
import { getListings, addListing } from "@/lib/listings";

export async function GET() {
  const listings = await getListings();
  return Response.json({ listings });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { playerId, playerName, cardName, grade, priceUSD,
          sellerWallet, sellerName, imageUrl } = body;

  if (!playerId || !playerName || !cardName || !priceUSD || !sellerWallet) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const listing = await addListing({
    playerId, playerName, cardName, grade,
    priceUSD, sellerWallet, sellerName,
    condition: "Mint",
    imageUrl,
  });

  return Response.json({ listing });
}