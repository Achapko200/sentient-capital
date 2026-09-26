// Data Integrity & Tamper Detection

import { signRequest } from "./crypto-utils";

const SIGNING_KEY = process.env.ADMIN_SECRET_KEY ?? "default-key-change-this";

// ── Price Integrity ────────────────────────────────────────────────────────────
// Prevent price manipulation by signing prices server-side
export async function signPrice(cardId: string, price: number, timestamp: number): Promise<string> {
  const payload = `${cardId}:${price}:${timestamp}`;
  return signRequest(payload, SIGNING_KEY);
}

export async function verifyPrice(
  cardId: string, price: number, timestamp: number, signature: string
): Promise<boolean> {
  // Price is only valid for 5 minutes
  if (Date.now() - timestamp > 300000) return false;
  const expected = await signRequest(`${cardId}:${price}:${timestamp}`, SIGNING_KEY);
  return expected === signature;
}

// ── Order Integrity ────────────────────────────────────────────────────────────
export async function signOrder(order: {
  userId: string; cardId: string; price: number; timestamp: number;
}): Promise<string> {
  const payload = `${order.userId}:${order.cardId}:${order.price}:${order.timestamp}`;
  return signRequest(payload, SIGNING_KEY);
}

// ── Webhook Replay Protection ─────────────────────────────────────────────────
import { Redis } from "@upstash/redis";
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function isReplayAttack(eventId: string): Promise<boolean> {
  const key    = `webhook:seen:${eventId}`;
  const seen   = await redis.get(key);
  if (seen) return true;
  await redis.set(key, "1", { ex: 86400 }); // Remember for 24 hours
  return false;
}
