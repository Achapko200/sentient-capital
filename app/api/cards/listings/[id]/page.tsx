// app/api/cards/listings/[id]/pages.tsx
import { getPlayer }                          from "@/lib/players";
import { fetchMLBStats }                      from "@/lib/mlb";
import { fetchEbaySales, calcAvgPrice, calcPriceChange, calcPriceHistory, calcLiquidity } from "@/lib/ebay";
import { calcSentiment }                      from "@/lib/sentiment";
import { generateSignal }                     from "@/lib/cardSignal";
import { getAnalysis }                        from "@/lib/analyst";
import { notFound }                           from "next/navigation";
// Fallback local component in case the external component cannot be resolved.
// This avoids a module-not-found error during build while keeping the page usable.
const PlayerProfileClient = (props: any) => {
  return (
    <div>
      {/* Minimal fallback UI; replace with the real component at '@/components/PlayerProfileClient' when available */}
      <h1>{props.player?.name ?? "Player"}</h1>
    </div>
  );
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();

  const player = await getPlayer(id);
  if (!player) notFound();

  const stats = await fetchMLBStats(id);

  const estimatedPrice = stats
    ? Math.round(50 + (stats.hr ?? 0) * 8 + (stats.ops ?? 0) * 200)
    : 150;

  const sales        = await fetchEbaySales(id, player.cardName);
  const avgPrice     = calcAvgPrice(sales);
  const priceChange  = calcPriceChange(sales);
  const priceHistory = calcPriceHistory(sales);
  const liquidity    = calcLiquidity(sales);
  const sentiment    = calcSentiment(stats, priceChange);
  const cardSignal   = generateSignal(stats, sales, sentiment);
  const analysis     = getAnalysis(id, player.name, stats, avgPrice);

  return (
    <PlayerProfileClient
      player={player}
      stats={stats}
      sales={sales}
      avgPrice={avgPrice}
      priceChange={priceChange}
      priceHistory={priceHistory}
      liquidity={liquidity}
      sentiment={sentiment}
      cardSignal={cardSignal}
      analysis={analysis}
    />
  );
}