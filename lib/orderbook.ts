// ─── lib/orderbook.ts ────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

export type Order = {
  id:        string;
  cardId:    string;
  type:      "BUY" | "SELL";
  price:     number;
  shares:    number;
  filled:    number;
  wallet:    string;
  status:    "OPEN" | "FILLED" | "CANCELLED" | "PARTIAL";
  createdAt: string;
};

export type Trade = {
  id:         string;
  cardId:     string;
  price:      number;
  shares:     number;
  buyWallet:  string;
  sellWallet: string;
  executedAt: string;
};

export type OrderBookSnapshot = {
  asks:      { price: number; shares: number; total: number }[];
  bids:      { price: number; shares: number; total: number }[];
  lastPrice: number;
  spread:    number;
  midpoint:  number;
};

// ─── Place order ──────────────────────────────────────────────────────────────
export async function placeOrder(
  cardId: string, type: "BUY" | "SELL",
  price: number, shares: number, wallet: string,
): Promise<Order> {
  const order = {
    id:         `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    card_id:    cardId,
    type,
    price,
    shares,
    filled:     0,
    wallet,
    status:     "OPEN",
    created_at: new Date().toISOString(),
  };

  await supabase.from("orders").insert(order);
  await matchOrders(cardId);

  return {
    id: order.id, cardId, type, price, shares,
    filled: 0, wallet, status: "OPEN", createdAt: order.created_at,
  };
}

// ─── Cancel order ─────────────────────────────────────────────────────────────
export async function cancelOrder(orderId: string, wallet: string): Promise<boolean> {
  const { data } = await supabase
    .from("orders")
    .select()
    .eq("id", orderId)
    .eq("wallet", wallet)
    .eq("status", "OPEN")
    .single();

  if (!data) return false;

  await supabase.from("orders").update({ status: "CANCELLED" }).eq("id", orderId);
  return true;
}

// ─── Match orders ─────────────────────────────────────────────────────────────
async function matchOrders(cardId: string): Promise<void> {
  const { data: openOrders } = await supabase
    .from("orders")
    .select()
    .eq("card_id", cardId)
    .eq("status", "OPEN")
    .order("created_at", { ascending: true });

  if (!openOrders) return;

  const asks = openOrders.filter(o => o.type === "SELL").sort((a, b) => a.price - b.price);
  const bids = openOrders.filter(o => o.type === "BUY").sort((a, b) => b.price - a.price);

  for (const bid of bids) {
    for (const ask of asks) {
      if (bid.price < ask.price) break;
      if (bid.status !== "OPEN" || ask.status !== "OPEN") continue;

      const sharesToFill = Math.min(bid.shares - bid.filled, ask.shares - ask.filled);
      const tradePrice   = ask.price;

      bid.filled += sharesToFill;
      ask.filled += sharesToFill;
      bid.status  = bid.filled >= bid.shares ? "FILLED" : "PARTIAL";
      ask.status  = ask.filled >= ask.shares ? "FILLED" : "PARTIAL";

      // Record trade
      const trade = {
        id:          `trd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        card_id:     cardId,
        price:       tradePrice,
        shares:      sharesToFill,
        buy_wallet:  bid.wallet,
        sell_wallet: ask.wallet,
        executed_at: new Date().toISOString(),
      };
      await supabase.from("trades").insert(trade);

      // Update positions
      await updatePosition(bid.wallet, cardId, sharesToFill, tradePrice, "BUY");
      await updatePosition(ask.wallet, cardId, sharesToFill, tradePrice, "SELL");

      // Update orders
      await supabase.from("orders").update({ filled: bid.filled, status: bid.status }).eq("id", bid.id);
      await supabase.from("orders").update({ filled: ask.filled, status: ask.status }).eq("id", ask.id);
    }
  }
}

// ─── Update position after trade ──────────────────────────────────────────────
async function updatePosition(
  wallet: string, cardId: string,
  shares: number, price: number, side: "BUY" | "SELL",
): Promise<void> {
  const { data: existing } = await supabase
    .from("positions")
    .select()
    .eq("wallet", wallet)
    .eq("card_id", cardId)
    .single();

  if (side === "BUY") {
    if (existing) {
      const totalShares = existing.shares + shares;
      const avgCost     = ((existing.avg_cost * existing.shares) + (price * shares)) / totalShares;
      await supabase.from("positions")
        .update({ shares: totalShares, avg_cost: avgCost })
        .eq("wallet", wallet).eq("card_id", cardId);
    } else {
      await supabase.from("positions")
        .insert({ wallet, card_id: cardId, shares, avg_cost: price });
    }
  } else {
    if (existing) {
      const remaining = existing.shares - shares;
      if (remaining <= 0) {
        await supabase.from("positions").delete()
          .eq("wallet", wallet).eq("card_id", cardId);
      } else {
        await supabase.from("positions").update({ shares: remaining })
          .eq("wallet", wallet).eq("card_id", cardId);
      }
    }
  }
}

// ─── Get order book snapshot ──────────────────────────────────────────────────
export async function getOrderBook(cardId: string): Promise<OrderBookSnapshot> {
  const { data: openOrders } = await supabase
    .from("orders")
    .select()
    .eq("card_id", cardId)
    .eq("status", "OPEN");

  const { data: lastTrade } = await supabase
    .from("trades")
    .select()
    .eq("card_id", cardId)
    .order("executed_at", { ascending: false })
    .limit(1)
    .single();

  const orders = openOrders ?? [];
  const asks   = orders.filter(o => o.type === "SELL");
  const bids   = orders.filter(o => o.type === "BUY");

  const aggregate = (list: any[], asc: boolean) => {
    const map = new Map<number, number>();
    for (const o of list) map.set(o.price, (map.get(o.price) ?? 0) + (o.shares - o.filled));
    return Array.from(map.entries())
      .sort((a, b) => asc ? a[0] - b[0] : b[0] - a[0])
      .slice(0, 8)
      .map(([price, shares], i, arr) => ({
        price, shares,
        total: arr.slice(0, i + 1).reduce((s, x) => s + x[1], 0),
      }));
  };

  const aggAsks   = aggregate(asks, true);
  const aggBids   = aggregate(bids, false);
  const lastPrice = lastTrade?.price ?? aggAsks[0]?.price ?? aggBids[0]?.price ?? 0;
  const spread    = aggAsks[0] && aggBids[0] ? Math.round((aggAsks[0].price - aggBids[0].price) * 100) / 100 : 0;
  const midpoint  = aggAsks[0] && aggBids[0]
    ? Math.round(((aggAsks[0].price + aggBids[0].price) / 2) * 100) / 100
    : lastPrice;

  return { asks: aggAsks, bids: aggBids, lastPrice, spread, midpoint };
}

export async function getRecentTrades(cardId: string, limit = 20): Promise<Trade[]> {
  const { data } = await supabase
    .from("trades")
    .select()
    .eq("card_id", cardId)
    .order("executed_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(t => ({
    id: t.id, cardId: t.card_id, price: t.price, shares: t.shares,
    buyWallet: t.buy_wallet, sellWallet: t.sell_wallet, executedAt: t.executed_at,
  }));
}

export async function getUserOrders(cardId: string, wallet: string): Promise<Order[]> {
  const { data } = await supabase
    .from("orders")
    .select()
    .eq("card_id", cardId)
    .eq("wallet", wallet)
    .order("created_at", { ascending: false });

  return (data ?? []).map(o => ({
    id: o.id, cardId: o.card_id, type: o.type, price: o.price,
    shares: o.shares, filled: o.filled, wallet: o.wallet,
    status: o.status, createdAt: o.created_at,
  }));
}

export async function getUserPositions(wallet: string): Promise<{ cardId: string; shares: number; avgCost: number }[]> {
  const { data } = await supabase
    .from("positions")
    .select()
    .eq("wallet", wallet)
    .gt("shares", 0);

  return (data ?? []).map(p => ({
    cardId: p.card_id, shares: p.shares, avgCost: p.avg_cost,
  }));
}