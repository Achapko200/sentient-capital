// Advanced Threat Intelligence & Behavioral Analysis
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Behavioral Biometrics ─────────────────────────────────────────────────────
// Track typing patterns, mouse movements, request timing
export async function analyzeBehavior(userId: string, action: string, metadata: Record<string, any>) {
  const key       = `behavior:${userId}`;
  const history   = await redis.lrange(key, 0, 99);
  const events    = history.map(h => typeof h === "string" ? JSON.parse(h) : h);

  // Build baseline
  const baseline = {
    avgTimeBetweenActions: events.length > 1
      ? events.slice(1).reduce((acc: number, e: any, i: number) => {
          const prev = new Date(events[i].timestamp).getTime();
          const curr = new Date(e.timestamp).getTime();
          return acc + (curr - prev);
        }, 0) / (events.length - 1)
      : null,
    commonActions: [...new Set(events.map((e: any) => e.action))],
    typicalHours:  [...new Set(events.map((e: any) => new Date(e.timestamp).getUTCHours()))],
  };

  // Current event
  const event = { action, metadata, timestamp: new Date().toISOString() };
  await redis.lpush(key, JSON.stringify(event));
  await redis.ltrim(key, 0, 999);
  await redis.expire(key, 86400 * 90); // 90 day history

  // Anomaly flags
  const flags: string[] = [];
  const hour = new Date().getUTCHours();
  if (baseline.typicalHours.length > 5 && !baseline.typicalHours.includes(hour)) {
    flags.push("unusual_hour");
  }
  if (!baseline.commonActions.includes(action) && baseline.commonActions.length > 10) {
    flags.push("unusual_action");
  }

  return { baseline, flags, riskScore: flags.length * 20 };
}

// ── Geographic Risk Scoring ───────────────────────────────────────────────────
const HIGH_RISK_COUNTRIES = ["KP", "IR", "CU", "SY", "RU", "BY", "MM"];
const MEDIUM_RISK_COUNTRIES = ["CN", "VN", "TR", "PK", "NG", "GH"];

export function getCountryRisk(countryCode: string): "low" | "medium" | "high" | "blocked" {
  if (HIGH_RISK_COUNTRIES.includes(countryCode)) return "blocked";
  if (MEDIUM_RISK_COUNTRIES.includes(countryCode)) return "high";
  return "low";
}

// ── API Abuse Detection ───────────────────────────────────────────────────────
export async function detectAPIAbuse(ip: string, endpoint: string): Promise<{
  abusive: boolean;
  pattern: string | null;
}> {
  const minuteKey = `api:${ip}:${endpoint}:${Math.floor(Date.now() / 60000)}`;
  const hourKey   = `api:${ip}:${endpoint}:${Math.floor(Date.now() / 3600000)}`;

  const [perMinute, perHour] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(hourKey),
  ]);
  await redis.expire(minuteKey, 120);
  await redis.expire(hourKey, 7200);

  if (perMinute > 30)  return { abusive: true,  pattern: "burst_attack" };
  if (perHour   > 500) return { abusive: true,  pattern: "sustained_attack" };
  return { abusive: false, pattern: null };
}

// ── Credential Stuffing Detection ─────────────────────────────────────────────
export async function detectCredentialStuffing(ip: string, email: string): Promise<boolean> {
  // Multiple different emails from same IP = credential stuffing
  const key     = `emails:tried:${ip}`;
  await redis.sadd(key, email);
  await redis.expire(key, 3600);
  const count = await redis.scard(key);
  return count > 5; // More than 5 different emails in an hour
}

// ── Data Exfiltration Detection ───────────────────────────────────────────────
export async function detectExfiltration(userId: string, dataSize: number): Promise<boolean> {
  const key     = `exfil:${userId}:${Math.floor(Date.now() / 3600000)}`;
  const total   = await redis.incrby(key, dataSize);
  await redis.expire(key, 7200);
  return total > 1000000; // > 1MB per hour is suspicious
}
