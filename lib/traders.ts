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

const TRADERS: Trader[] = [
  {
    id: "1",
    name: "CardKing_ETH",
    avatar: "👑",
    wallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    ensName: null,
    holdDays: 47,
    positions: [
      { cardName: "2024 Topps Chrome Rookie PSA 10", playerId: "683002", playerName: "Paul Skenes",      buyPrice: 180, currentPrice: 280, quantity: 3,  buyDate: "Jan 2025" },
      { cardName: "2018 Topps Update Rookie PSA 10", playerId: "660670", playerName: "Ronald Acuña Jr.", buyPrice: 310, currentPrice: 420, quantity: 2,  buyDate: "Feb 2025" },
    ],
    totalInvested: 1160,
    unrealizedGain: 680,
    unrealizedPct: 58.6,
  },
  {
    id: "2",
    name: "DiamondHands_BB",
    avatar: "💎",
    wallet: "0x983110309620D911731Ac0932219af06091b6744",
    ensName: null,
    holdDays: 91,
    positions: [
      { cardName: "2023 Topps Chrome PSA 10",        playerId: "671939", playerName: "Gunnar Henderson", buyPrice: 110, currentPrice: 185, quantity: 5,  buyDate: "Nov 2024" },
      { cardName: "2022 Topps Chrome Rookie PSA 10", playerId: "694973", playerName: "Julio Rodriguez",  buyPrice: 95,  currentPrice: 145, quantity: 4,  buyDate: "Dec 2024" },
    ],
    totalInvested: 930,
    unrealizedGain: 755,
    unrealizedPct: 81.2,
  },
  {
    id: "3",
    name: "BaseballVC",
    avatar: "📈",
    wallet: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    ensName: null,
    holdDays: 23,
    positions: [
      { cardName: "2024 Bowman Chrome Auto PSA 10",  playerId: "682998", playerName: "Jackson Holliday", buyPrice: 65, currentPrice: 95,  quantity: 8,  buyDate: "Mar 2025" },
      { cardName: "2024 Topps Chrome Rookie PSA 10", playerId: "808967", playerName: "Wyatt Langford",   buyPrice: 55, currentPrice: 75,  quantity: 6,  buyDate: "Mar 2025" },
    ],
    totalInvested: 850,
    unrealizedGain: 490,
    unrealizedPct: 57.6,
  },
  {
    id: "4",
    name: "RookieHunter",
    avatar: "🎯",
    wallet: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
    ensName: null,
    holdDays: 134,
    positions: [
      { cardName: "2024 Topps Chrome Rookie PSA 10", playerId: "683002", playerName: "Paul Skenes",      buyPrice: 120, currentPrice: 280, quantity: 10, buyDate: "Sep 2024" },
      { cardName: "2024 Bowman Chrome Auto PSA 10",  playerId: "682998", playerName: "Jackson Holliday", buyPrice: 45,  currentPrice: 95,  quantity: 12, buyDate: "Oct 2024" },
    ],
    totalInvested: 1740,
    unrealizedGain: 2140,
    unrealizedPct: 123.0,
  },
  {
    id: "5",
    name: "CryptoCardClub",
    avatar: "⚡",
    wallet: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    ensName: null,
    holdDays: 68,
    positions: [
      { cardName: "2018 Topps Update Rookie PSA 10", playerId: "660670", playerName: "Ronald Acuña Jr.", buyPrice: 280, currentPrice: 420, quantity: 3,  buyDate: "Dec 2024" },
      { cardName: "2023 Topps Chrome PSA 10",        playerId: "671939", playerName: "Gunnar Henderson", buyPrice: 130, currentPrice: 185, quantity: 4,  buyDate: "Jan 2025" },
    ],
    totalInvested: 1360,
    unrealizedGain: 1160,
    unrealizedPct: 85.3,
  },
];

export function getLeaderboard(): Trader[] {
  return [...TRADERS].sort((a, b) => b.unrealizedGain - a.unrealizedGain);
}

export function getTrader(id: string): Trader | undefined {
  return TRADERS.find((t) => t.id === id);
}