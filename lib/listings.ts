export type Listing = {
  id:          string;
  playerId:    string;
  playerName:  string;
  cardName:    string;
  grade:       string;
  priceUSD:    number;
  sellerWallet: string;
  sellerName:  string;
  condition:   string;
  imageUrl:    string;
  listedAt:    string;
  sold:        boolean;
  txHash:      string | null;
};
 
// Seed listings — replace sellerWallet with your real wallet address
let LISTINGS: Listing[] = [
  {
    id:           "lst_001",
    playerId:     "683002",
    playerName:   "Paul Skenes",
    cardName:     "2024 Topps Chrome Rookie",
    grade:        "PSA 10",
    priceUSD:     285,
    sellerWallet: "0xYOUR_WALLET_HERE",
    sellerName:   "CardKing",
    condition:    "Mint",
    imageUrl:     "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/683002/headshot/67/current",
    listedAt:     new Date().toISOString(),
    sold:         false,
    txHash:       null,
  },
  {
    id:           "lst_002",
    playerId:     "660670",
    playerName:   "Ronald Acuña Jr.",
    cardName:     "2018 Topps Update Rookie",
    grade:        "PSA 10",
    priceUSD:     420,
    sellerWallet: "0xYOUR_WALLET_HERE",
    sellerName:   "CardKing",
    condition:    "Mint",
    imageUrl:     "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660670/headshot/67/current",
    listedAt:     new Date().toISOString(),
    sold:         false,
    txHash:       null,
  },
  {
    id:           "lst_003",
    playerId:     "671939",
    playerName:   "Gunnar Henderson",
    cardName:     "2023 Topps Chrome",
    grade:        "PSA 10",
    priceUSD:     185,
    sellerWallet: "0xYOUR_WALLET_HERE",
    sellerName:   "CardKing",
    condition:    "Mint",
    imageUrl:     "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/671939/headshot/67/current",
    listedAt:     new Date().toISOString(),
    sold:         false,
    txHash:       null,
  },
];
 
export function getListings(): Listing[] {
  return LISTINGS.filter((l) => !l.sold);
}
 
export function getListing(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}
 
export function markSold(id: string, txHash: string): void {
  LISTINGS = LISTINGS.map((l) =>
    l.id === id ? { ...l, sold: true, txHash } : l
  );
}
 
export function addListing(listing: Omit<Listing, "id" | "listedAt" | "sold" | "txHash">): Listing {
  const newListing: Listing = {
    ...listing,
    id:       `lst_${Date.now()}`,
    listedAt: new Date().toISOString(),
    sold:     false,
    txHash:   null,
  };
  LISTINGS = [newListing, ...LISTINGS];
  return newListing;
}