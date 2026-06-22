import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const ensClient = createPublicClient({
  chain: mainnet,
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
  currentPrice: number; // fetched live
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
  totalInvested:  number;   // computed
  unrealizedGain: number;   // computed
  unrealizedPct:  number;   // computed
  holdDays:       number;
};

// ─── Only static data: identity + what they bought/when ───────────────────────
// Prices, gains, ENS — all resolved at runtime
const RAW_TRADERS = [
  {
    id: "1", name: "CardKing_ETH", avatar: "👑",
    wallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    holdDays: 47,
    positions: [
      { playerId: "683002", playerName: "Paul Skenes",      cardName: "2024 Topps Chrome Rookie PSA 10", buyPrice: 180, quantity: 3,  buyDate: "Jan 2025" },
      { playerId: "660670", playerName: "Ronald Acuña Jr.", cardName: "2018 Topps Update Rookie PSA 10", buyPrice: 310, quantity: 2,  buyDate: "Feb 2025" },
    ],
  },
  {
    id: "2", name: "DiamondHands_BB", avatar: "💎",
    wallet: "0x983110309620D911731Ac0932219af06091b6744",
    holdDays: 91,
    positions: [
      { playerId: "671939", playerName: "Gunnar Henderson", cardName: "2023 Topps Chrome PSA 10",        buyPrice: 110, quantity: 5,  buyDate: "Nov 2024" },
      { playerId: "694973", playerName: "Julio Rodriguez",  cardName: "2022 Topps Chrome Rookie PSA 10", buyPrice: 95,  quantity: 4,  buyDate: "Dec 2024" },
    ],
  },
  {
    id: "3", name: "BaseballVC", avatar: "📈",
    wallet: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    holdDays: 23,
    positions: [
      { playerId: "682998", playerName: "Jackson Holliday", cardName: "2024 Bowman Chrome Auto PSA 10",  buyPrice: 65,  quantity: 8,  buyDate: "Mar 2025" },
      { playerId: "808967", playerName: "Wyatt Langford",   cardName: "2024 Topps Chrome Rookie PSA 10", buyPrice: 55,  quantity: 6,  buyDate: "Mar 2025" },
    ],
  },
  {
    id: "4", name: "RookieHunter", avatar: "🎯",
    wallet: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
    holdDays: 134,
    positions: [
      { playerId: "683002", playerName: "Paul Skenes",      cardName: "2024 Topps Chrome Rookie PSA 10", buyPrice: 120, quantity: 10, buyDate: "Sep 2024" },
      { playerId: "682998", playerName: "Jackson Holliday", cardName: "2024 Bowman Chrome Auto PSA 10",  buyPrice: 45,  quantity: 12, buyDate: "Oct 2024" },
    ],
  },
  {
    id: "5", name: "CryptoCardClub", avatar: "⚡",
    wallet: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    holdDays: 68,
    positions: [
      { playerId: "660670", playerName: "Ronald Acuña Jr.", cardName: "2018 Topps Update Rookie PSA 10", buyPrice: 280, quantity: 3,  buyDate: "Dec 2024" },
      { playerId: "671939", playerName: "Gunnar Henderson", cardName: "2023 Topps Chrome PSA 10",        buyPrice: 130, quantity: 4,  buyDate: "Jan 2025" },
    ],
  },
];

// ─── Fetch live card price from your price API ─────────────────────────────────
async function fetchCurrentPrice(playerId: string, cardName: string): Promise<number> {
  try {
    const res = await fetch(
      `/api/cards/price?playerId=${playerId}&cardName=${encodeURIComponent(cardName)}`
    );
    const data = await res.json();
    return data.price ?? 0;
  } catch {
    return 0;
  }
}

// ─── Compute totals from positions (no hardcoding) ────────────────────────────
function computeStats(positions: Position[]) {
  const totalInvested  = positions.reduce((s, p) => s + p.buyPrice * p.quantity, 0);
  const currentValue   = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const unrealizedGain = currentValue - totalInvested;
  const unrealizedPct  = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;
  return { totalInvested, unrealizedGain, unrealizedPct: Math.round(unrealizedPct * 10) / 10 };
}

// ─── Hydrate: resolve ENS + live prices + compute stats ───────────────────────
export async function hydrateTraders(): Promise<Trader[]> {
  return Promise.all(
    RAW_TRADERS.map(async (raw) => {
      // Resolve ENS and all position prices in parallel
      const [ensName, ...prices] = await Promise.all([
        resolveENS(raw.wallet).then(n => n !== raw.wallet ? n : null),
        ...raw.positions.map(p => fetchCurrentPrice(p.playerId, p.cardName)),
      ]);

      const positions: Position[] = raw.positions.map((p, i) => ({
        ...p,
        currentPrice: prices[i] as number,
      }));

      return {
        ...raw,
        ensName,
        positions,
        ...computeStats(positions),
      };
    })
  );
}

export async function getLeaderboard(): Promise<Trader[]> {
  const traders = await hydrateTraders();
  return traders.sort((a, b) => b.unrealizedGain - a.unrealizedGain);
}

export async function getTrader(id: string): Promise<Trader | undefined> {
  const traders = await hydrateTraders();
  return traders.find(t => t.id === id);
}