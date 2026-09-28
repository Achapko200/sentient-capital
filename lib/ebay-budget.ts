// Counts every eBay API call per day (eBay's day resets at midnight Pacific).
// Hard cap keeps us under eBay's ~5,000/day allowance. A real 429 from eBay
// marks the day as used up so we stop hammering it until the reset.
import { Redis } from "@upstash/redis";

export const EBAY_DAILY_CAP = Number(process.env.EBAY_DAILY_CAP ?? 4500);

let redis: Redis | null = null;
try {
  const url   = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) redis = new Redis({ url, token });
} catch { redis = null; }

function dayKey() {
  const d = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  return `ebay:calls:${d}`;
}

// true = allowed to call eBay (and counts the call)
export async function takeEbayCall(): Promise<boolean> {
  if (!redis) return true;
  try {
    const key = dayKey();
    const n   = await redis.incr(key);
    if (n === 1) await redis.expire(key, 172_800);
    return n <= EBAY_DAILY_CAP;
  } catch { return true; }
}

export async function markEbayExhausted(): Promise<void> {
  if (!redis) return;
  try { await redis.set(dayKey(), EBAY_DAILY_CAP + 1, { ex: 172_800 }); } catch {}
}

export async function getEbayUsage(): Promise<{ used: number; cap: number }> {
  if (!redis) return { used: 0, cap: EBAY_DAILY_CAP };
  try { return { used: Number(await redis.get(dayKey())) || 0, cap: EBAY_DAILY_CAP }; }
  catch { return { used: 0, cap: EBAY_DAILY_CAP }; }
}
