// app/api/admin/listings/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
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