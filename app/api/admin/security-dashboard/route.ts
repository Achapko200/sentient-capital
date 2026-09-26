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

  const [secScore, recentEvents, bannedIPs, threatKeys] = await Promise.all([
    getPlatformSecurityScore(),
    redis.lrange("audit:log", 0, 49),
    redis.keys("banned:ip:*"),
    redis.keys("threat:score:*"),
  ]);

  const threatScores = await Promise.all(
    threatKeys.slice(0, 20).map(async (key: string) => {
      const ip    = key.replace("threat:score:", "");
      const score = await redis.get(key);
      return { ip: ip.replace(/\.\d+\.\d+$/, ".***.**"), score: Number(score) };
    })
  );

  return Response.json({
    platform:     secScore,
    bannedIPs:    bannedIPs.length,
    topThreats:   threatScores.sort((a, b) => b.score - a.score).slice(0, 10),
    recentEvents: recentEvents
      .map(e => typeof e === "string" ? JSON.parse(e) : e)
      .map(e => ({
        ...e,
        ip: e.ip ? e.ip.replace(/\.\d+\.\d+$/, ".***.**") : "unknown",
      })),
  });
}
