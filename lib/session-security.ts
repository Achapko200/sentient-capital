import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Session Management ────────────────────────────────────────────────────────
export async function registerSession(userId: string, sessionId: string, req: Request) {
  const ip          = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ua          = req.headers.get("user-agent") ?? "unknown";
  const country     = req.headers.get("cf-ipcountry") ?? "unknown";
  const sessionData = {
    userId, ip, ua, country,
    createdAt: new Date().toISOString(),
    lastSeen:  new Date().toISOString(),
  };

  // Store session
  await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), { ex: 86400 * 30 });

  // Track active sessions per user (max 5 devices)
  await redis.lpush(`sessions:user:${userId}`, sessionId);
  await redis.ltrim(`sessions:user:${userId}`, 0, 4);
  await redis.expire(`sessions:user:${userId}`, 86400 * 30);
}

export async function invalidateAllSessions(userId: string) {
  const sessions = await redis.lrange(`sessions:user:${userId}`, 0, -1);
  for (const sid of sessions) {
    await redis.del(`session:${sid as string}`);
  }
  await redis.del(`sessions:user:${userId}`);
}

export async function getActiveSessions(userId: string) {
  const sessionIds = await redis.lrange(`sessions:user:${userId}`, 0, -1);
  const sessions   = await Promise.all(
    sessionIds.map(async (sid: any) => {
      const data = await redis.get(`session:${sid}`);
      return data ? { id: sid, ...JSON.parse(data as string) } : null;
    })
  );
  return sessions.filter(Boolean);
}

// ── Token Rotation ────────────────────────────────────────────────────────────
export async function shouldRotateToken(userId: string): Promise<boolean> {
  const key        = `token:rotation:${userId}`;
  const lastRotate = await redis.get(key);
  if (!lastRotate) {
    await redis.set(key, Date.now().toString(), { ex: 3600 });
    return false;
  }
  // Rotate every hour
  const age = Date.now() - Number(lastRotate);
  if (age > 3600000) {
    await redis.set(key, Date.now().toString(), { ex: 3600 });
    return true;
  }
  return false;
}

// ── Concurrent Session Detection ──────────────────────────────────────────────
export async function detectConcurrentSessions(userId: string): Promise<boolean> {
  const sessions = await getActiveSessions(userId);
  return sessions.length > 3; // More than 3 concurrent sessions is suspicious
}
