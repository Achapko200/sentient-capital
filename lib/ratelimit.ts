// ─── lib/ratelimit.ts ─────────────────────────────────────────────────────────
import { Ratelimit } from "@upstash/ratelimit";
import { Redis }     from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different route types
export const rateLimiters = {
  // Read routes — generous
  read: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(300, "1 m"),
    prefix:    "rl:read",
    analytics: true,
  }),

  // Write routes — strict
  write: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(10, "1 m"),
    prefix:    "rl:write",
    analytics: true,
  }),

  // Trade routes — very strict
  trade: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(5, "1 m"),
    prefix:    "rl:trade",
    analytics: true,
  }),

  // Search — moderate
  search: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(30, "1 m"),
    prefix:    "rl:search",
    analytics: true,
  }),
};

export function getIdentifier(req: Request): string {
  // Prefer the platform-provided client IP headers. For forwarded chains, use
  // the final hop rather than the caller-controlled first entry.
  const edgeIp = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (edgeIp?.trim()) return edgeIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  const chain     = forwarded?.split(",").map(part => part.trim()).filter(Boolean) ?? [];
  const ip        = chain[chain.length - 1] ?? "anonymous";
  return ip;
}

export async function checkRateLimit(
  req:     Request,
  limiter: keyof typeof rateLimiters,
): Promise<Response | null> {
  const identifier = getIdentifier(req);
  const { success, limit, remaining, reset } = await rateLimiters[limiter].limit(identifier);

  if (!success) {
    return new Response(
      JSON.stringify({
        error:   "Too many requests — slow down",
        limit,
        remaining: 0,
        reset:   new Date(reset).toISOString(),
      }),
      {
        status:  429,
        headers: {
          "Content-Type":      "application/json",
          "X-RateLimit-Limit":     String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":     String(reset),
          "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return null; // null means allowed
}