// ─── lib/listings.ts ─────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

export type Listing = {
  id:           string;
  playerId:     string;
  playerName:   string;
  cardName:     string;
  grade:        string;
  priceUSD:     number;
  sellerWallet: string;
  sellerName:   string;
  condition:    string;
  imageUrl:     string;
  listedAt:     string;
  sold:         boolean;
  txHash:       string | null;
};

function toListing(row: any): Listing {
  return {
    id:           row.id,
    playerId:     row.player_id,
    playerName:   row.player_name,
    cardName:     row.card_name,
    grade:        row.grade,
    priceUSD:     row.price_usd,
    sellerWallet: row.seller_wallet,
    sellerName:   row.seller_name,
    condition:    row.condition,
    imageUrl:     row.image_url,
    listedAt:     row.listed_at,
    sold:         row.sold,
    txHash:       row.tx_hash,
  };
}

export async function getListings(): Promise<Listing[]> {
  const { data } = await supabase
    .from("listings")
    .select()
    .eq("sold", false)
    .order("listed_at", { ascending: false });
  return (data ?? []).map(toListing);
}

export async function getListing(id: string): Promise<Listing | null> {
  const { data } = await supabase
    .from("listings")
    .select()
    .eq("id", id)
    .single();
  return data ? toListing(data) : null;
}

export async function addListing(
  listing: Omit<Listing, "id" | "listedAt" | "sold" | "txHash">
): Promise<Listing> {
  const row = {
    id:            `lst_${Date.now()}`,
    player_id:     listing.playerId,
    player_name:   listing.playerName,
    card_name:     listing.cardName,
    grade:         listing.grade,
    price_usd:     listing.priceUSD,
    seller_wallet: listing.sellerWallet,
    seller_name:   listing.sellerName,
    condition:     listing.condition,
    image_url:     listing.imageUrl,
    listed_at:     new Date().toISOString(),
    sold:          false,
    tx_hash:       null,
  };
  await supabase.from("listings").insert(row);
  return toListing(row);
}

export async function markSold(id: string, txHash: string): Promise<void> {
  await supabase.from("listings")
    .update({ sold: true, tx_hash: txHash })
    .eq("id", id);
}