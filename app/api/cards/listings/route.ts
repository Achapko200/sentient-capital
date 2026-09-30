// ─── app/api/cards/listings/route.ts ─────────────────────────────────────────
import { getListings, addListing } from "@/lib/listings";
import { ListingSchema }           from "@/lib/validators";
import { checkRateLimit }          from "@/lib/ratelimit";
import { getVerifiedUser } from "@/lib/verify-user";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  try {
    const listings = await getListings();
    return Response.json({ listings });
  } catch {
    return Response.json({ listings: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;
  // Must be signed in to list a card
  const seller = await getVerifiedUser(req);
  if (!seller) return Response.json({ error: "Please sign in to list a card." }, { status: 401 });

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
      playerId, playerName, cardName, grade,
      priceUSD, sellerWallet, sellerName,
      condition: "Mint", imageUrl,
    });
    return Response.json({ listing });
  } catch {
    return Response.json({ error: "Failed to create listing" }, { status: 500 });
  }
}