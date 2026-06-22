import { NextResponse } from "next/server";
import { supabase }     from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("sold", false)
    .order("listed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = data.map((row) => ({
    id:           row.id,
    playerId:     row.player_id,
    playerName:   row.player_name,
    cardName:     row.card_name,
    grade:        row.grade,
    priceUSD:     row.price_usd,
    sellerWallet: row.seller_wallet,
    sellerName:   row.seller_name,
    imageUrl:     row.image_url,
    listedAt:     row.listed_at,
    sold:         row.sold,
    txHash:       row.tx_hash,
  }));

  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("listings")
    .insert({
      id:            `lst_${Date.now()}`,
      player_id:     body.playerId,
      player_name:   body.playerName,
      card_name:     body.cardName,
      grade:         body.grade,
      price_usd:     body.priceUSD,
      seller_wallet: body.sellerWallet,
      seller_name:   body.sellerName,
      image_url:     body.imageUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: data });
}