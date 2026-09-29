// ─── app/api/cards/orderbook/route.ts ────────────────────────────────────────
import { getOrderBook, getRecentTrades }  from "@/lib/orderbook";
import { getWatchlist, getPlayer }        from "@/lib/players";
import { fetchMLBStats }                  from "@/lib/mlb";
import { priceFromStats, getCandleTimestamp } from "@/lib/cardToken";
import type { CardToken }                 from "@/lib/cardToken";
import { checkRateLimit }                 from "@/lib/ratelimit";
import { getCandles }                     from "@/lib/price-history";
import { getMarketPrices }                from "@/lib/market-prices";
import { getMarketData }                  from "@/lib/market-cache";

const CHART_DAYS = 14;

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

const dayOf = (c: any) => new Date(getCandleTimestamp(c)).toISOString().slice(0, 10);

// One 14-day series: eBay new-listing candles per day, saved daily prices fill the gaps
function mergeCandles(listing: any[], saved: any[]) {
  const cutoff = Date.now() - CHART_DAYS * 86_400_000;
  const byDay  = new Map<string, any>();
  for (const c of listing) byDay.set(dayOf(c), c);
  for (const c of saved)   if (!byDay.has(dayOf(c))) byDay.set(dayOf(c), c);
  return [...byDay.values()]
    .filter(c => getCandleTimestamp(c) >= cutoff && Number(c.close) > 0)
    .sort((a, b) => getCandleTimestamp(a) - getCandleTimestamp(b));
}

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const cardId = new URL(req.url).searchParams.get("cardId");
  if (cardId && !/^\d+$/.test(cardId)) {
    return Response.json({ error: "Invalid cardId" }, { status: 400 });
  }

  try {
    // One card: cached market data + 14-day chart (instant)
    if (cardId) {
      const player: any = await getPlayer(cardId);
      if (!player) return Response.json({ error: "Card not found" }, { status: 404 });

      const [stats, market, book, trades, savedCandles] = await Promise.all([
        fetchMLBStats(player.id),
        getMarketData(String(player.id), player.cardName ?? player.name),
        getOrderBook(cardId),
        getRecentTrades(cardId),
        getCandles(cardId, CHART_DAYS),
      ]);

      const recentTrades = trades.slice(0, 50);
      const prices       = recentTrades.map((t: any) => t.price);
      const firstPrice   = prices[prices.length - 1];
      const lastPrice    = prices[0];
      const token = tokenFor(player, market.price > 0 ? priceFromStats(stats, market.price) : 0, {
        askPrice:     book.asks[0]?.price ?? null,
        bidPrice:     book.bids[0]?.price ?? null,
        volume24h:    recentTrades.reduce((s: number, t: any) => s + t.shares, 0),
        changePct24h: firstPrice > 0 && lastPrice > 0 ? Math.round(((lastPrice - firstPrice) / firstPrice) * 1000) / 10 : 0,
      });

      const candles      = mergeCandles(market.candles, savedCandles);
      const candleSource = candles.length === 0 ? null : market.candles.length > 0 ? "new_listings" : "daily_prices";
      return Response.json({ token, book, trades, candles, candleSource, hasHistory: candles.length > 0, marketUpdatedAt: market.updatedAt });
    }

    // All cards: from saved prices only (fast, no live eBay calls)
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
