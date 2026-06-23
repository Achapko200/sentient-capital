// ─── lib/listings.ts ─────────────────────────────────────────────────────────
import { supabaseAdmin } from "@/lib/supabase-server";

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
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select()
    .eq("sold", false)
    .order("listed_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(toListing);
}

export async function getListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select()
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return toListing(data);
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

  const { error } = await supabaseAdmin.from("listings").insert(row);
  if (error) throw new Error(error.message);
  return toListing(row);
}

export async function markSold(id: string, txHash: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("listings")
    .update({ sold: true, tx_hash: txHash })
    .eq("id", id)
    .eq("sold", false); // prevent double-selling
  if (error) throw new Error(error.message);
}