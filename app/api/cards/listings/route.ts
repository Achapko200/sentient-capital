// ─── app/api/cards/listings/route.ts ─────────────────────────────────────────
import { getListings, addListing } from "@/lib/listings";
import { ListingSchema }           from "@/lib/validators";

export async function GET() {
  try {
    const listings = await getListings();
    return Response.json({ listings });
  } catch {
    return Response.json({ listings: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ListingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { playerId, playerName, cardName, grade, priceUSD,
          sellerWallet, sellerName, imageUrl } = parsed.data;

  try {
    const listing = await addListing({
      playerId,
      playerName,
      cardName,
      grade,
      priceUSD,
      sellerWallet,
      sellerName,
      condition: "Mint",
      imageUrl,
    });
    return Response.json({ listing });
  } catch {
    return Response.json({ error: "Failed to create listing" }, { status: 500 });
  }
}