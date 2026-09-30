import { Redis } from "@upstash/redis";
import { requireAdmin } from "@/lib/admin-auth";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [auditLog, bannedIPs] = await Promise.all([
    redis.lrange("audit:log", 0, 99),
    redis.keys("banned:ip:*"),
  ]);

  return Response.json({
    recentEvents: auditLog.map(e => typeof e === "string" ? JSON.parse(e) : e),
    bannedIPs:    bannedIPs.map(k => k.replace("banned:ip:", "")),
    totalEvents:  await redis.llen("audit:log"),
  });
}
