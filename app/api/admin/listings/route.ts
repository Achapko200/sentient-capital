// app/api/admin/listings/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data } = await supabaseAdmin
      .from("listings")
      .select()
      .order("listed_at", { ascending: false })
      .limit(100);

    const listings = (data ?? []).map((l: any) => ({
      id:           l.id,
      playerName:   l.player_name,
      cardName:     l.card_name,
      grade:        l.grade,
      priceUSD:     l.price_usd,
      sellerWallet: l.seller_wallet,
      sold:         l.sold,
      listedAt:     l.listed_at,
    }));

    return Response.json({ listings });
  } catch {
    return Response.json({ listings: [] }, { status: 500 });
  }
}