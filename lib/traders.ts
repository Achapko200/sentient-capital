// ─── lib/traders.ts ──────────────────────────────────────────────────────────
import { createPublicClient, http }    from "viem";
import { mainnet }                      from "viem/chains";
import { supabaseAdmin }                from "@/lib/supabase-server";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";

const ensClient = createPublicClient({
  chain:     mainnet,
  transport: http("https://cloudflare-eth.com"),
});

export async function resolveENS(address: string): Promise<string | null> {
  try {
    const name = await ensClient.getEnsName({ address: address as `0x${string}` });
    return name ?? null;
  } catch {
    return null;
  }
}

export type Position = {
  cardName:     string;
  playerId:     string;
  playerName:   string;
  buyPrice:     number;
  currentPrice: number;
  quantity:     number;
  buyDate:      string;
};

export type Trader = {
  id:             string;
  name:           string;
  avatar:         string;
  wallet:         string;
  ensName:        string | null;
  positions:      Position[];
  totalInvested:  number;
  unrealizedGain: number;
  unrealizedPct:  number;
  holdDays:       number;
};

const AVATARS = ["🎯", "🐂", "🏆", "👑", "🦈", "🎲", "🚀", "💎", "🔥", "⚡"];

function walletAvatar(wallet: string): string {
  const idx = Math.abs(
    wallet.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  ) % AVATARS.length;
  return AVATARS[idx];
}

function computeStats(positions: Position[]) {
  const totalInvested  = positions.reduce((s, p) => s + p.buyPrice * p.quantity, 0);
  const currentValue   = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const unrealizedGain = Math.round((currentValue - totalInvested) * 100) / 100;
  const unrealizedPct  = totalInvested > 0
    ? Math.round((unrealizedGain / totalInvested) * 1000) / 10
    : 0;
  return { totalInvested, unrealizedGain, unrealizedPct };
}

export async function getLeaderboard(): Promise<Trader[]> {
  try {
    // Get all real positions
    const { data: posRows } = await supabaseAdmin
      .from("positions")
      .select("*")
      .gt("shares", 0);

    if (!posRows || posRows.length === 0) return [];

    // Group by wallet
    const byWallet = new Map<string, any[]>();
    for (const pos of posRows) {
      if (!byWallet.has(pos.wallet)) byWallet.set(pos.wallet, []);
      byWallet.get(pos.wallet)!.push(pos);
    }

    // Get trades to calculate hold days
    const { data: trades } = await supabaseAdmin
      .from("trades")
      .select("buy_wallet, executed_at")
      .order("executed_at", { ascending: true });

    const firstTrade = new Map<string, Date>();
    for (const t of trades ?? []) {
      if (!firstTrade.has(t.buy_wallet)) {
        firstTrade.set(t.buy_wallet, new Date(t.executed_at));
      }
    }

    const traders: Trader[] = [];

    for (const [wallet, walletPositions] of byWallet) {
      const positionList: Position[] = [];

      for (const pos of walletPositions) {
        try {
          const estimatedPrice = pos.avg_cost ?? 150;
          const sales = await fetchEbaySales(pos.card_id, estimatedPrice);
          const currentPrice = calcAvgPrice(sales) || estimatedPrice;

          positionList.push({
            cardName:     pos.card_id,
            playerId:     pos.card_id,
            playerName:   pos.card_id,
            buyPrice:     pos.avg_cost ?? 0,
            currentPrice,
            quantity:     pos.shares,
            buyDate:      new Date(pos.created_at ?? Date.now()).toLocaleDateString(),
          });
        } catch {
          // skip
        }
      }

      if (positionList.length === 0) continue;

      const ensName  = await resolveENS(wallet);
      const holdDays = firstTrade.has(wallet)
        ? Math.floor((Date.now() - firstTrade.get(wallet)!.getTime()) / 86400000)
        : 0;

      traders.push({
        id:      wallet,
        wallet,
        name:    ensName ?? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
        avatar:  walletAvatar(wallet),
        ensName,
        holdDays,
        positions: positionList,
        ...computeStats(positionList),
      });
    }

    return traders.sort((a, b) => b.unrealizedGain - a.unrealizedGain);
  } catch {
    return [];
  }
}

export async function addTrader(
  name: string, avatar: string, wallet: string
): Promise<void> {
  const id = `trader_${Date.now()}`;
  await supabaseAdmin.from("traders").insert({
    id, name, avatar, wallet, hold_days: 0,
  });
}