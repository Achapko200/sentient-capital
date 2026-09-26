import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface ThreatIntel {
  ip:           string;
  score:        number;  // 0-100, higher = more dangerous
  reasons:      string[];
  firstSeen:    string;
  lastSeen:     string;
  requestCount: number;
  blocked:      boolean;
}

export async function updateThreatScore(ip: string, reason: string, delta: number): Promise<number> {
  const key   = `threat:score:${ip}`;
  const score = await redis.incrbyfloat(key, delta);
  await redis.expire(key, 86400 * 7); // 7 days

  // Log the reason
  await redis.lpush(`threat:reasons:${ip}`, JSON.stringify({ reason, timestamp: new Date().toISOString() }));
  await redis.ltrim(`threat:reasons:${ip}`, 0, 99);
  await redis.expire(`threat:reasons:${ip}`, 86400 * 7);

  // Auto-block at score 100
  if (score >= 100) {
    await redis.set(`banned:ip:${ip}`, "1", { ex: 86400 * 30 }); // 30 day ban
  }

  return score;
}

export async function getThreatIntel(ip: string): Promise<ThreatIntel> {
  const [score, reasons, banned, count] = await Promise.all([
    redis.get(`threat:score:${ip}`),
    redis.lrange(`threat:reasons:${ip}`, 0, 9),
    redis.get(`banned:ip:${ip}`),
    redis.get(`req:count:${ip}`),
  ]);

  return {
    ip,
    score:        Number(score ?? 0),
    reasons:      reasons.map(r => typeof r === "string" ? JSON.parse(r).reason : r),
    firstSeen:    new Date().toISOString(),
    lastSeen:     new Date().toISOString(),
    requestCount: Number(count ?? 0),
    blocked:      !!banned,
  };
}

export async function trackRequest(ip: string): Promise<number> {
  const key   = `req:count:${ip}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600);
  return count;
}

// Security score for the whole platform
export async function getPlatformSecurityScore(): Promise<{
  score: number;
  threats: number;
  blocked: number;
  events: number;
}> {
  const [bannedKeys, eventCount] = await Promise.all([
    redis.keys("banned:ip:*"),
    redis.llen("audit:log"),
  ]);

  const threats = bannedKeys.length;
  const score   = Math.max(0, 100 - threats * 2);

  return { score, threats, blocked: threats, events: eventCount };
}
