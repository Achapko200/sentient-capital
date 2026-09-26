import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type AuditEvent =
  | "LOGIN"
  | "LOGOUT"
  | "PURCHASE"
  | "SUBSCRIPTION_CHANGE"
  | "ALERT_CREATE"
  | "ALERT_DELETE"
  | "CARD_LIST"
  | "SELL_REQUEST"
  | "PASSKEY_REGISTER"
  | "MFA_ENABLE"
  | "SUSPICIOUS_REQUEST"
  | "RATE_LIMIT_HIT"
  | "AUTH_FAILURE"
  | "ADMIN_ACCESS"
  | "IP_AUTO_BANNED"
  | "IP_BLOCKED";

export async function audit(
  event:  AuditEvent,
  userId: string | null,
  meta:   Record<string, any> = {},
  req?:   Request,
) {
  try {
    const ip = req ? (
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown"
    ) : "server";

    const { scrubPII } = await import("./crypto-utils");
    const scrubbed = scrubPII(meta);

    const entry = {
      event,
      userId:    userId ?? "anonymous",
      ip,
      ua:        req?.headers.get("user-agent") ?? "unknown",
      path:      req ? new URL(req.url).pathname : "server",
      timestamp: new Date().toISOString(),
      meta:      scrubbed,
    };

    // Store in Redis — keep last 10,000 events
    await redis.lpush("audit:log", JSON.stringify(entry));
    await redis.ltrim("audit:log", 0, 9999);

    // Real-time alerts for critical events
    if (event === "IP_AUTO_BANNED" || (event === "AUTH_FAILURE" && meta.action === "payment")) {
      const { sendSecurityAlert } = await import("./real-time-alerts");
      await sendSecurityAlert(event, { ...scrubbed, ip }, 
        event === "IP_AUTO_BANNED" ? "high" : "critical"
      );
    }

    // Alert on critical events
    if (["AUTH_FAILURE", "SUSPICIOUS_REQUEST", "RATE_LIMIT_HIT"].includes(event)) {
      const key   = `threat:${ip}`;
      const count = await redis.incr(key);
      await redis.expire(key, 3600);

      // Auto-ban after 50 threats in 1 hour
      if (count >= 50) {
        await redis.set(`banned:ip:${ip}`, "1", { ex: 86400 * 7 }); // 7 day ban
        await redis.lpush("audit:log", JSON.stringify({
          event: "IP_AUTO_BANNED", userId: "system", ip,
          timestamp: new Date().toISOString(), meta: { reason: event, count },
        }));
      }
    }
  } catch {}
}

export async function isIPBanned(ip: string): Promise<boolean> {
  try {
    const banned = await redis.get(`banned:ip:${ip}`);
    return !!banned;
  } catch { return false; }
}
