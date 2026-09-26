// Zero Trust Security Model
// "Never trust, always verify" — every request is treated as potentially hostile

import { Redis } from "@upstash/redis";
import { signRequest, generateSessionFingerprint } from "./crypto-utils";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Device Trust Score ────────────────────────────────────────────────────────
export async function getDeviceTrustScore(req: Request, userId: string): Promise<number> {
  let score = 100; // Start trusted, deduct for anomalies

  const ua          = req.headers.get("user-agent") ?? "";
  const fingerprint = await generateSessionFingerprint(req);
  const storedFP    = await redis.get(`device:fp:${userId}`);

  // Known device fingerprint
  if (storedFP && storedFP !== fingerprint) {
    score -= 40; // Different device = suspicious
  }

  // Check if IP changed significantly
  const ip         = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "";
  const lastIP     = await redis.get(`last:ip:${userId}`);
  if (lastIP && lastIP !== ip) score -= 20;

  // Time-based anomaly — requests at unusual hours
  const hour = new Date().getUTCHours();
  if (hour >= 2 && hour <= 5) score -= 10; // 2-5am UTC is suspicious

  // Velocity check — too many requests too fast
  const reqCount = await redis.incr(`velocity:${userId}:${Math.floor(Date.now() / 60000)}`);
  await redis.expire(`velocity:${userId}:${Math.floor(Date.now() / 60000)}`, 120);
  if (reqCount > 60) score -= 30; // > 60 req/min

  // Store fingerprint and IP for future checks
  await redis.set(`device:fp:${userId}`, fingerprint, { ex: 86400 * 30 });
  await redis.set(`last:ip:${userId}`,   ip,          { ex: 86400 });

  return Math.max(0, score);
}

// ── Anomaly Detection ─────────────────────────────────────────────────────────
export async function detectAnomalies(req: Request, userId: string): Promise<{
  anomalies: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}> {
  const anomalies: string[] = [];
  const ua  = req.headers.get("user-agent") ?? "";
  const ip  = req.headers.get("cf-connecting-ip") ?? "";

  // Check for VPN/Tor/proxy (via Cloudflare headers)
  const isTor  = req.headers.get("cf-ipcountry") === "T1";
  if (isTor) anomalies.push("tor_exit_node");

  // Impossible travel detection
  const lastCountry = await redis.get(`last:country:${userId}`);
  const country     = req.headers.get("cf-ipcountry") ?? "unknown";
  if (lastCountry && lastCountry !== country && lastCountry !== "unknown") {
    anomalies.push(`impossible_travel:${lastCountry}→${country}`);
  }
  await redis.set(`last:country:${userId}`, country, { ex: 86400 });

  // Headless browser detection
  if (!ua.includes("Mozilla") || ua.includes("HeadlessChrome")) {
    anomalies.push("headless_browser");
  }

  // Credential stuffing pattern
  const authFailures = await redis.get(`auth:fail:${ip}`);
  if (Number(authFailures) > 3) anomalies.push("credential_stuffing");

  // Determine risk level
  const riskLevel =
    anomalies.length === 0 ? "low"      :
    anomalies.length === 1 ? "medium"   :
    anomalies.length <= 3  ? "high"     : "critical";

  return { anomalies, riskLevel };
}

// ── Continuous Authentication ─────────────────────────────────────────────────
export async function requireContinuousAuth(
  req: Request,
  userId: string,
  action: "read" | "write" | "payment" | "admin",
): Promise<{ authorized: boolean; reason?: string }> {
  const trustScore = await getDeviceTrustScore(req, userId);
  const { riskLevel, anomalies } = await detectAnomalies(req, userId);

  // Thresholds by action sensitivity
  const thresholds = {
    read:    { minTrust: 20, maxRisk: "high"     },
    write:   { minTrust: 50, maxRisk: "medium"   },
    payment: { minTrust: 70, maxRisk: "low"      },
    admin:   { minTrust: 90, maxRisk: "low"      },
  };

  const { minTrust, maxRisk } = thresholds[action];
  const riskOrder = ["low", "medium", "high", "critical"];

  if (trustScore < minTrust) {
    return { authorized: false, reason: `trust_score_too_low:${trustScore}` };
  }
  if (riskOrder.indexOf(riskLevel) > riskOrder.indexOf(maxRisk)) {
    return { authorized: false, reason: `risk_too_high:${riskLevel}:${anomalies.join(",")}` };
  }

  return { authorized: true };
}
