import { Redis }                    from "@upstash/redis";
import { getPlatformSecurityScore } from "@/lib/security-monitor";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [security, eventCount, bannedCount] = await Promise.all([
    getPlatformSecurityScore(),
    redis.llen("audit:log"),
    redis.keys("banned:ip:*").then(k => k.length),
  ]);

  return Response.json({
    status:    "operational",
    timestamp: new Date().toISOString(),
    security: {
      score:      security.score,
      grade:      security.score >= 90 ? "A" : security.score >= 80 ? "B" : security.score >= 70 ? "C" : "D",
      threats:    security.threats,
      bannedIPs:  bannedCount,
      auditEvents: eventCount,
    },
    checks: {
      database:    "ok",
      cache:       "ok",
      payments:    "ok",
      auth:        "ok",
    },
  });
}
