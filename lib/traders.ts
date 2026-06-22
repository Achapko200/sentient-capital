// ─── lib/traders.ts ──────────────────────────────────────────────────────────
import { createPublicClient, http } from "viem";
import { mainnet }                  from "viem/chains";
import { supabase }                 from "@/lib/supabase";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";

const ensClient = createPublicClient({
  chain:     mainnet,
  transport: http("https://cloudflare-eth.com"),
});

export async function resolveENS(address: string): Promise<string> {
  try {
    const name = await ensClient.getEnsName({ address: address as `0x${string}` });
    return name ?? address;
  } catch {
    return address;
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

// ─── Seed traders on first run if table is empty ──────────────────────────────
const SEED_TRADERS = [
  { id: "1", name: "CardKing_ETH",    avatar: "👑", wallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", holdDays: 47 },
  { id: "2", name: "DiamondHands_BB", avatar: "💎", wallet: "0x983110309620D911731Ac0932219af06091b6744", holdDays: 91 },
  { id: "3", name: "BaseballVC",      avatar: "📈", wallet: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", holdDays: 23 },
  { id: "4", name: "RookieHunter",    avatar: "🎯", wallet: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8", holdDays: 134 },
  { id: "5", name: "CryptoCardClub",  avatar: "⚡", wallet: "0x00000000219ab540356cBB839Cbe05303d7705Fa", holdDays: 68 },
];

const SEED_POSITIONS = [
  { id: "p1",  trader_id: "1", player_id: "683002", player_name: "Paul Skenes",      card_name: "2024 Topps Chrome Rookie PSA 10", buy_price: 180, quantity: 3,  buy_date: "Jan 2025" },
  { id: "p2",  trader_id: "1", player_id: "660670", player_name: "Ronald Acuña Jr.", card_name: "2018 Topps Update Rookie PSA 10", buy_price: 310, quantity: 2,  buy_date: "Feb 2025" },
  { id: "p3",  trader_id: "2", player_id: "671939", player_name: "Gunnar Henderson", card_name: "2023 Topps Chrome PSA 10",        buy_price: 110, quantity: 5,  buy_date: "Nov 2024" },
  { id: "p4",  trader_id: "2", player_id: "694973", player_name: "Julio Rodriguez",  card_name: "2022 Topps Chrome Rookie PSA 10", buy_price: 95,  quantity: 4,  buy_date: "Dec 2024" },
  { id: "p5",  trader_id: "3", player_id: "682998", player_name: "Jackson Holliday", card_name: "2024 Bowman Chrome Auto PSA 10",  buy_price: 65,  quantity: 8,  buy_date: "Mar 2025" },
  { id: "p6",  trader_id: "3", player_id: "808967", player_name: "Wyatt Langford",   card_name: "2024 Topps Chrome Rookie PSA 10", buy_price: 55,  quantity: 6,  buy_date: "Mar 2025" },
  { id: "p7",  trader_id: "4", player_id: "683002", player_name: "Paul Skenes",      card_name: "2024 Topps Chrome Rookie PSA 10", buy_price: 120, quantity: 10, buy_date: "Sep 2024" },
  { id: "p8",  trader_id: "4", player_id: "682998", player_name: "Jackson Holliday", card_name: "2024 Bowman Chrome Auto PSA 10",  buy_price: 45,  quantity: 12, buy_date: "Oct 2024" },
  { id: "p9",  trader_id: "5", player_id: "660670", player_name: "Ronald Acuña Jr.", card_name: "2018 Topps Update Rookie PSA 10", buy_price: 280, quantity: 3,  buy_date: "Dec 2024" },
  { id: "p10", trader_id: "5", player_id: "671939", player_name: "Gunnar Henderson", card_name: "2023 Topps Chrome PSA 10",        buy_price: 130, quantity: 4,  buy_date: "Jan 2025" },
];

async function seedIfEmpty(): Promise<void> {
  const { count } = await supabase
    .from("traders")
    .select("*", { count: "exact", head: true });
  if (count && count > 0) return;
  await supabase.from("traders").insert(
    SEED_TRADERS.map(t => ({
      id: t.id, name: t.name, avatar: t.avatar,
      wallet: t.wallet, hold_days: t.holdDays,
    }))
  );
  await supabase.from("trader_positions").insert(SEED_POSITIONS);
}

function computeStats(positions: Position[]) {
  const totalInvested  = positions.reduce((s, p) => s + p.buyPrice * p.quantity, 0);
  const currentValue   = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const unrealizedGain = currentValue - totalInvested;
  const unrealizedPct  = totalInvested > 0
    ? Math.round((unrealizedGain / totalInvested) * 1000) / 10 : 0;
  return { totalInvested, unrealizedGain, unrealizedPct };
}

export async function getLeaderboard(): Promise<Trader[]> {
  await seedIfEmpty();

  const { data: traderRows } = await supabase
    .from("traders")
    .select("*, trader_positions(*)");

  if (!traderRows) return [];

  const traders = await Promise.all(
    traderRows.map(async (row) => {
      const rawPositions: any[] = row.trader_positions ?? [];

      // Resolve ENS + live prices in parallel
      const [ensName, ...prices] = await Promise.all([
        resolveENS(row.wallet).then(n => n !== row.wallet ? n : null),
        ...rawPositions.map(p => fetchEbaySales(p.player_id, p.card_name)
          .then(sales => calcAvgPrice(sales) || p.buy_price)),
      ]);

      const positions: Position[] = rawPositions.map((p, i) => ({
        cardName:     p.card_name,
        playerId:     p.player_id,
        playerName:   p.player_name,
        buyPrice:     p.buy_price,
        currentPrice: prices[i] as number,
        quantity:     p.quantity,
        buyDate:      p.buy_date,
      }));

      return {
        id:       row.id,
        name:     row.name,
        avatar:   row.avatar,
        wallet:   row.wallet,
        holdDays: row.hold_days,
        ensName:  ensName as string | null,
        positions,
        ...computeStats(positions),
      };
    })
  );

  return traders.sort((a, b) => b.unrealizedGain - a.unrealizedGain);
}

export async function addTrader(
  name: string, avatar: string, wallet: string
): Promise<void> {
  const id = `trader_${Date.now()}`;
  await supabase.from("traders").insert({
    id, name, avatar, wallet, hold_days: 0,
  });
}