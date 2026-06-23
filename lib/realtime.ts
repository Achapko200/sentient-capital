// ─── lib/realtime.ts ─────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

type PriceCallback = (cardId: string, price: number) => void;

export function subscribeToTrades(callback: PriceCallback) {
  // Use a unique channel name per subscription to avoid conflicts
  const channelName = `trades-${Math.random().toString(36).slice(2, 9)}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "trades" },
      (payload) => {
        const trade = payload.new as { card_id: string; price: number };
        callback(trade.card_id, trade.price);
      }
    )
    .subscribe();
}

export function subscribeToListings(callback: () => void) {
  const channelName = `listings-${Math.random().toString(36).slice(2, 9)}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "listings" },
      callback
    )
    .subscribe();
}