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

  const players = await getWatchlist();

  const tokens: CardToken[] = await Promise.all(
    players.map(async (player) => {
      const [stats, sales] = await Promise.all([
        fetchMLBStats(player.id),
        fetchEbaySales(player.id, player.cardName),
      ]);
      const avgCardPrice   = calcAvgPrice(sales) || 150;
      const pricePerShare  = priceFromStats(stats, avgCardPrice);
      const book           = getOrderBook(player.id);

      return {
        id:            player.id,
        playerId:      player.id,
        playerName:    player.name,
        cardName:      player.cardName,
        totalShares:   100,
        pricePerShare,
        askPrice:      book.asks[0]?.price ?? null,
        bidPrice:      book.bids[0]?.price ?? null,
        volume24h:     Math.round(Math.random() * 800 + 200),
        changePct24h:  Math.round((Math.random() - 0.4) * 20 * 10) / 10,
        psaCert:       `PSA-${player.id}-2025`,
        vaultStatus:   "VERIFIED" as const,
        cardImage:     player.cardImage,
        teamColor:     player.teamColor,
        cardColor:     player.cardColor,
      };
    })
  );

  if (cardId) {
    const token  = tokens.find(t => t.id === cardId);
    const book   = getOrderBook(cardId);
    const trades = getRecentTrades(cardId);
    const candles = generateCandles(token?.pricePerShare ? token.pricePerShare * 100 : 150);
    return Response.json({ token, book, trades, candles });
  }

  return Response.json({ tokens });
}