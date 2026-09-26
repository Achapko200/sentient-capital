import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── IP Blocking ───────────────────────────────────────────────────────────────
export async function isIPBlocked(ip: string): Promise<boolean> {
  const blocked = await redis.get(`blocked:ip:${ip}`);
  return !!blocked;
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  const key     = `failed:${ip}`;
  const count   = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour window

  // Block IP after 20 failed attempts
  if (count >= 20) {
    await redis.set(`blocked:ip:${ip}`, "1", { ex: 86400 }); // 24 hour block
    await logSecurityEvent("IP_BLOCKED", { ip, attempts: count });
  }
}

// ── Security Event Logging ────────────────────────────────────────────────────
export async function logSecurityEvent(event: string, data: Record<string, any>): Promise<void> {
  try {
    const log = {
      event,
      data,
      timestamp: new Date().toISOString(),
      env:       process.env.NODE_ENV,
    };
    // Store last 1000 security events
    await redis.lpush("security:events", JSON.stringify(log));
    await redis.ltrim("security:events", 0, 999);
  } catch {}
}

// ── Input Sanitization ────────────────────────────────────────────────────────
export function sanitizeString(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/[<>]/g, "");
}

// ── CSRF Token ────────────────────────────────────────────────────────────────
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Request Validation ────────────────────────────────────────────────────────
export function getClientIP(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("cf-connecting-ip") ??      // Cloudflare
    headers.get("x-real-ip") ??             // Nginx
    headers.get("x-forwarded-for")?.split(",")[0].trim() ?? // Load balancer
    "unknown"
  );
}

export function isSuspiciousRequest(req: Request): boolean {
  const ua  = req.headers.get("user-agent") ?? "";
  const url = req.url;

  // Known bad user agents
  const badAgents = [
    "sqlmap", "nikto", "nmap", "masscan", "zgrab",
    "python-requests", "go-http-client", "curl/7",
    "scrapy", "burpsuite", "nuclei",
  ];
  if (badAgents.some(a => ua.toLowerCase().includes(a))) return true;

  // SQL injection patterns
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
  ];
  if (sqlPatterns.some(p => p.test(url))) return true;

  // Path traversal
  if (url.includes("../") || url.includes("..%2F")) return true;

  // XSS patterns in URL
  if (/<script|javascript:|onerror=|onload=/i.test(decodeURIComponent(url))) return true;

  return false;
}
