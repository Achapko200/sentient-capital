// ─── lib/orderbook.ts ────────────────────────────────────────────────────────

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
  id:        string;
  cardId:    string;
  price:     number;
  shares:    number;
  buyWallet: string;
  sellWallet: string;
  executedAt: string;
};

export type OrderBookSnapshot = {
  asks: { price: number; shares: number; total: number }[]; // sell orders, low→high
  bids: { price: number; shares: number; total: number }[]; // buy orders, high→low
  lastPrice:  number;
  spread:     number;
  midpoint:   number;
};

// ─── In-memory order book (replace with Supabase for production) ──────────────
const ORDERS: Map<string, Order[]> = new Map();
const TRADES: Trade[] = [];

function getOrders(cardId: string): Order[] {
  return ORDERS.get(cardId) ?? [];
}

export function placeOrder(
  cardId:    string,
  type:      "BUY" | "SELL",
  price:     number,
  shares:    number,
  wallet:    string,
): Order {
  const order: Order = {
    id:        `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cardId,
    type,
    price,
    shares,
    filled:    0,
    wallet,
    status:    "OPEN",
    createdAt: new Date().toISOString(),
  };

  const existing = getOrders(cardId);
  ORDERS.set(cardId, [...existing, order]);

  // Try to match immediately
  matchOrders(cardId);
  return order;
}

export function cancelOrder(orderId: string, cardId: string, wallet: string): boolean {
  const orders = getOrders(cardId);
  const order  = orders.find(o => o.id === orderId && o.wallet === wallet);
  if (!order || order.status !== "OPEN") return false;
  order.status = "CANCELLED";
  return true;
}

// ─── Order matching engine ────────────────────────────────────────────────────
function matchOrders(cardId: string): void {
  const orders = getOrders(cardId);

  const asks = orders
    .filter(o => o.type === "SELL" && o.status === "OPEN")
    .sort((a, b) => a.price - b.price); // lowest ask first

  const bids = orders
    .filter(o => o.type === "BUY" && o.status === "OPEN")
    .sort((a, b) => b.price - a.price); // highest bid first

  for (const bid of bids) {
    for (const ask of asks) {
      if (bid.price < ask.price) break; // no match possible
      if (bid.status !== "OPEN" || ask.status !== "OPEN") continue;

      const sharesToFill = Math.min(
        bid.shares - bid.filled,
        ask.shares - ask.filled,
      );

      const tradePrice = ask.price; // price improves for buyer

      bid.filled += sharesToFill;
      ask.filled += sharesToFill;

      if (bid.filled >= bid.shares) bid.status = "FILLED";
      else bid.status = "PARTIAL";

      if (ask.filled >= ask.shares) ask.status = "FILLED";
      else ask.status = "PARTIAL";

      TRADES.push({
        id:          `trd_${Date.now()}`,
        cardId,
        price:       tradePrice,
        shares:      sharesToFill,
        buyWallet:   bid.wallet,
        sellWallet:  ask.wallet,
        executedAt:  new Date().toISOString(),
      });
    }
  }
}

// ─── Get order book snapshot ──────────────────────────────────────────────────
export function getOrderBook(cardId: string): OrderBookSnapshot {
  const orders = getOrders(cardId);

  const rawAsks = orders.filter(o => o.type === "SELL" && o.status === "OPEN");
  const rawBids = orders.filter(o => o.type === "BUY"  && o.status === "OPEN");

  // Aggregate by price level
  const aggregateOrders = (list: Order[], asc: boolean) => {
    const map = new Map<number, number>();
    for (const o of list) {
      map.set(o.price, (map.get(o.price) ?? 0) + (o.shares - o.filled));
    }
    return Array.from(map.entries())
      .sort((a, b) => asc ? a[0] - b[0] : b[0] - a[0])
      .slice(0, 8)
      .map(([price, shares], i, arr) => ({
        price,
        shares,
        total: arr.slice(0, i + 1).reduce((s, x) => s + x[1], 0),
      }));
  };

  const asks      = aggregateOrders(rawAsks, true);
  const bids      = aggregateOrders(rawBids, false);
  const lastTrade = TRADES.filter(t => t.cardId === cardId).at(-1);
  const lastPrice = lastTrade?.price ?? asks[0]?.price ?? bids[0]?.price ?? 0;
  const spread    = asks[0] && bids[0] ? Math.round((asks[0].price - bids[0].price) * 100) / 100 : 0;
  const midpoint  = asks[0] && bids[0] ? Math.round(((asks[0].price + bids[0].price) / 2) * 100) / 100 : lastPrice;

  return { asks, bids, lastPrice, spread, midpoint };
}

export function getRecentTrades(cardId: string, limit = 20): Trade[] {
  return TRADES.filter(t => t.cardId === cardId).slice(-limit).reverse();
}

export function getUserOrders(cardId: string, wallet: string): Order[] {
  return getOrders(cardId).filter(o => o.wallet === wallet);
}

export function getUserPositions(wallet: string): Map<string, number> {
  const positions = new Map<string, number>();

  for (const trades of TRADES) {
    if (trades.buyWallet === wallet) {
      positions.set(trades.cardId, (positions.get(trades.cardId) ?? 0) + trades.shares);
    }
    if (trades.sellWallet === wallet) {
      positions.set(trades.cardId, (positions.get(trades.cardId) ?? 0) - trades.shares);
    }
  }
  return positions;
}