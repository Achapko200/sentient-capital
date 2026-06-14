export type CryptoToken = {
  symbol:  string;
  name:    string;
  icon:    string;
  color:   string;
  network: string;
};
 
export const SUPPORTED_TOKENS: CryptoToken[] = [
  { symbol: "ETH",  name: "Ethereum",   icon: "⟠",  color: "text-blue-500",   network: "Ethereum" },
  { symbol: "SOL",  name: "Solana",     icon: "◎",  color: "text-purple-500", network: "Solana" },
  { symbol: "USDC", name: "USD Coin",   icon: "$",  color: "text-blue-400",   network: "Ethereum / Solana" },
  { symbol: "BTC",  name: "Bitcoin",    icon: "₿",  color: "text-orange-500", network: "Bitcoin" },
];
 
export type CryptoPrice = {
  symbol: string;
  usd:    number;
};
 
// Fetch live crypto prices from CoinGecko (free, no key needed)
export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,usd-coin,bitcoin&vs_currencies=usd",
      { next: { revalidate: 60 } },
    );
    const data = await res.json();
    return [
      { symbol: "ETH",  usd: data.ethereum?.usd  ?? 3500 },
      { symbol: "SOL",  usd: data.solana?.usd     ?? 165  },
      { symbol: "USDC", usd: data["usd-coin"]?.usd ?? 1   },
      { symbol: "BTC",  usd: data.bitcoin?.usd    ?? 68000 },
    ];
  } catch {
    return [
      { symbol: "ETH",  usd: 3500  },
      { symbol: "SOL",  usd: 165   },
      { symbol: "USDC", usd: 1     },
      { symbol: "BTC",  usd: 68000 },
    ];
  }
}
 
export function usdToCrypto(usd: number, cryptoPrice: number): string {
  const amount = usd / cryptoPrice;
  if (amount < 0.001) return amount.toFixed(6);
  if (amount < 1)     return amount.toFixed(4);
  return amount.toFixed(3);
}