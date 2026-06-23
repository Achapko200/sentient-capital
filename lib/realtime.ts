// ─── lib/realtime.ts ─────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

type PriceCallback = (cardId: string, price: number) => void;

export function subscribeToTrades(callback: PriceCallback) {
  return supabase
    .channel("trades")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "trades" },
      (payload) => {
        const trade = payload.new;
        callback(trade.card_id, trade.price);
      }
    )
    .subscribe();
}

export function subscribeToListings(callback: () => void) {
  return supabase
    .channel("listings")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "listings" },
      callback
    )
    .subscribe();
}