import { createConfig, http } from "wagmi";
import { base, baseSepolia }  from "wagmi/chains";
import { coinbaseWallet }     from "wagmi/connectors";
 
export const config = createConfig({
  chains:     [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "Card Tracker",
      appLogoUrl: "https://your-site.com/logo.png",
    }),
  ],
  transports: {
    [base.id]:        http("https://mainnet.base.org"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});
 
// USDC contract address on Base mainnet
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
 
// USDC ABI — just what we need for transfers
export const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "value",  type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;