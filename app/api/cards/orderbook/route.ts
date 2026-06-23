// ─── app/api/cards/orderbook/route.ts ────────────────────────────────────────
import { getOrderBook, getRecentTrades } from "@/lib/orderbook";
import { getWatchlist }                  from "@/lib/players";
import { fetchMLBStats }                 from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice }  from "@/lib/ebay";
import { priceFromStats, generateCandles } from "@/lib/cardToken";
import type { CardToken }                from "@/lib/cardToken";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");

  // Validate cardId if provided
  if (cardId && !/^\d+$/.test(cardId)) {
    return Response.json({ error: "Invalid cardId" }, { status: 400 });
  }

  try {
    const players = await getWatchlist();

    const tokens: Array<CardToken | null> = await Promise.all(
      players.map(async (player): Promise<CardToken | null> => {
        try {
          const stats = await fetchMLBStats(player.id);

          const estimatedPrice = stats
            ? Math.round(50 + (stats.hr ?? 0) * 8 + (stats.ops ?? 0) * 200)
            : 150;

          const [sales, book] = await Promise.all([
            fetchEbaySales(player.id, player.cardName),
            getOrderBook(player.id),
          ]);

          const avgCardPrice  = calcAvgPrice(sales) || estimatedPrice;
          const pricePerShare = priceFromStats(stats, avgCardPrice);

          // Derive volume and change from real order book data
          const recentTrades  = await getRecentTrades(player.id, 50);
          const volume24h     = recentTrades.reduce((s, t) => s + t.shares, 0);
          const prices        = recentTrades.map(t => t.price);
          const firstPrice    = prices[prices.length - 1] ?? pricePerShare;
          const lastPrice     = prices[0] ?? pricePerShare;
          const changePct24h  = firstPrice > 0
            ? Math.round(((lastPrice - firstPrice) / firstPrice) * 1000) / 10
            : 0;

          return {
            id:           player.id,
            playerId:     player.id,
            playerName:   player.name,
            cardName:     player.cardName,
            totalShares:  100,
            pricePerShare,
            askPrice:     book.asks[0]?.price ?? 0,
            bidPrice:     book.bids[0]?.price ?? 0,
            volume24h,
            changePct24h,
            psaCert:      `PSA-${player.id}-2025`,
            vaultStatus:  "VERIFIED" as const,
            cardImage:    player.cardImage,
            teamColor:    player.teamColor,
            cardColor:    player.cardColor,
          };
        } catch {
          // Don't let one player failure break the whole list
          return null;
        }
      })
    );

    const validTokens = tokens.filter(
      (token): token is CardToken => token !== null
    );

    // Single card detail view
    if (cardId) {
      const token = validTokens.find(t => t.id === cardId);
      if (!token) {
        return Response.json({ error: "Card not found" }, { status: 404 });
      }

      const [book, trades] = await Promise.all([
        getOrderBook(cardId),
        getRecentTrades(cardId),
      ]);

      const candles = generateCandles(
        token.pricePerShare ? token.pricePerShare * 100 : 150
      );

      return Response.json({ token, book, trades, candles });
    }

    return Response.json({ tokens: validTokens });
  } catch {
    return Response.json({ tokens: [] }, { status: 500 });
  }
}