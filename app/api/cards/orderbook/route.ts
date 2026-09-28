// ─── app/api/cards/orderbook/route.ts ────────────────────────────────────────
import { getOrderBook, getRecentTrades }  from "@/lib/orderbook";
import { getWatchlist, getPlayer }        from "@/lib/players";
import { fetchMLBStats }                  from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice, fetchNewListingCandles } from "@/lib/ebay";
import { priceFromStats }                 from "@/lib/cardToken";
import type { CardToken }                 from "@/lib/cardToken";
import { checkRateLimit }                 from "@/lib/ratelimit";
import { getCandles, recordPriceSnapshot } from "@/lib/price-history";
import { getMarketPrices }                from "@/lib/market-prices";

// A single daily point is a snapshot, not a useful historical chart. Require
// at least two dates, then try the eBay listing series as the fallback source.
const MIN_CANDLES = 2;

function tokenFor(player: any, pricePerShare: number, extra: Partial<CardToken> = {}): CardToken {
  return {
    id:           player.id,
    playerId:     player.id,
    playerName:   player.name,
    cardName:     player.cardName,
    totalShares:  100,
    pricePerShare,
    askPrice:     null,
    bidPrice:     null,
    volume24h:    0,
    changePct24h: 0,
    psaCert:      `PSA-${player.id}-2025`,
    vaultStatus:  "VERIFIED" as const,
    cardImage:    player.cardImage,
    teamColor:    player.teamColor,
    cardColor:    player.cardColor,
    ...extra,
  } as CardToken;
}

// Full live token for one card (used when a single card is opened)
async function buildToken(player: any): Promise<CardToken | null> {
  try {
    const [stats, sales, book, recentTrades] = await Promise.all([
      fetchMLBStats(player.id),
      fetchEbaySales(player.id, player.cardName),
      getOrderBook(player.id),
      getRecentTrades(player.id, 50),
    ]);

    const avgCardPrice  = calcAvgPrice(sales);      // real eBay price only, 0 if none
    await recordPriceSnapshot(player.id, avgCardPrice, sales.length);
    const pricePerShare = avgCardPrice > 0 ? priceFromStats(stats, avgCardPrice) : 0;

    const prices       = recentTrades.map((t: any) => t.price);
    const firstPrice   = prices[prices.length - 1];
    const lastPrice    = prices[0];
    const changePct24h = firstPrice > 0 && lastPrice > 0
      ? Math.round(((lastPrice - firstPrice) / firstPrice) * 1000) / 10
      : 0;

    return tokenFor(player, pricePerShare, {
      askPrice:  book.asks[0]?.price ?? null,
      bidPrice:  book.bids[0]?.price ?? null,
      volume24h: recentTrades.reduce((s: number, t: any) => s + t.shares, 0),
      changePct24h,
    });
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const cardId = new URL(req.url).searchParams.get("cardId");
  if (cardId && !/^\d+$/.test(cardId)) {
    return Response.json({ error: "Invalid cardId" }, { status: 400 });
  }

  try {
    // One card: live data + chart
    if (cardId) {
      const player = await getPlayer(cardId);
      if (!player) return Response.json({ error: "Card not found" }, { status: 404 });

      const [token, book, trades] = await Promise.all([
        buildToken(player),
        getOrderBook(cardId),
        getRecentTrades(cardId),
      ]);
      if (!token) return Response.json({ error: "Card not found" }, { status: 404 });

      // buildToken records today's live eBay price; query history afterward so
      // the chart includes that snapshot instead of racing it.
      const savedCandles = await getCandles(cardId, 14);
      // Use whichever real source covers more days: saved daily prices, or the last 14 days of new eBay listings
      const listingCandles = savedCandles.length >= 14
        ? []
        : await fetchNewListingCandles((player as any).cardName ?? player.name);
      let candles: any[]              = [];
      let candleSource: string | null = null;
      if (savedCandles.length >= MIN_CANDLES && savedCandles.length >= listingCandles.length) {
        candles = savedCandles; candleSource = "daily_prices";
      } else if (listingCandles.length >= MIN_CANDLES) {
        candles = listingCandles; candleSource = "new_listings";
      }
      return Response.json({ token, book, trades, candles, candleSource, hasHistory: candles.length > 0 });
    }

    // All cards: from saved daily prices only (fast, no live eBay calls)
    const [players, prices] = await Promise.all([getWatchlist(), getMarketPrices()]);
    const tokens = players
      .filter((p: any) => prices.has(String(p.id)))
      .map((p: any) => {
        const cardPrice = prices.get(String(p.id))!;
        let pricePerShare = Math.round(cardPrice) / 100;
        try { pricePerShare = priceFromStats(null as any, cardPrice) || pricePerShare; } catch {}
        return tokenFor(p, pricePerShare);
      })
      .sort((a, b) => b.pricePerShare - a.pricePerShare);
    return Response.json({ tokens });
  } catch (err) {
    console.error("[orderbook] error:", err);
    return Response.json({ tokens: [] }, { status: 500 });
  }
}
