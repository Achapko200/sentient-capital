// ─── lib/validators.ts ───────────────────────────────────────────────────────
import { z } from "zod";

// ─── Install zod if you haven't: npm install zod ─────────────────────────────

const walletAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address");
const alertWallet = z.string().trim().min(1).max(200);

export const AlertSchema = z.object({
  wallet:      alertWallet,
  cardId:      z.string().min(1).max(20),
  playerName:  z.string().min(1).max(100),
  targetPrice: z.number().positive().max(1000000),
  direction:   z.enum(["ABOVE", "BELOW"]),
  email:       z.string().email().optional().nullable(),
});

export const TradeSchema = z.object({
  action:    z.enum(["place", "cancel"]),
  cardId:    z.string().min(1).max(20).optional(),
  type:      z.enum(["BUY", "SELL"]).optional(),
  price:     z.number().positive().max(1000000).optional(),
  shares:    z.number().int().positive().max(100).optional(),
  wallet:    walletAddress,
  signature: z.string().min(1).optional(),
  orderId:   z.string().optional(),
});

export const ListingSchema = z.object({
  playerId:     z.string().min(1).max(20),
  playerName:   z.string().min(1).max(100),
  cardName:     z.string().min(1).max(200),
  grade:        z.enum(["PSA 10", "PSA 9", "PSA 8", "BGS 9.5", "BGS 9", "Raw"]),
  priceUSD:     z.number().positive().max(1000000),
  sellerWallet: walletAddress,
  sellerName:   z.string().min(1).max(100),
  imageUrl:     z.string().url(),
});

export const OrderSchema = z.object({
  wallet:  walletAddress,
  cardId:  z.string().min(1).max(20),
  type:    z.enum(["BUY", "SELL"]),
  price:   z.number().positive().max(1000000),
  shares:  z.number().int().min(1).max(100),
});