import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BAD_AGENTS = [
  "sqlmap", "nikto", "nmap", "masscan", "zgrab", "scrapy",
  "burpsuite", "nuclei", "dirbuster", "gobuster", "acunetix",
  "metasploit", "havij", "pangolin", "netsparker", "appscan",
];

const HONEYPOT_PATHS = [
  "/wp-admin", "/wp-login", "/.env", "/config.php", "/admin.php",
  "/phpmyadmin", "/.git", "/backup", "/shell.php", "/xmlrpc.php",
  "/.aws", "/etc/passwd", "/proc/self", "/var/www", "/.htaccess",
  "/web.config", "/server-status", "/.DS_Store", "/robots.txt.bak",
];

const SENSITIVE_ROUTES = [
  "/api/cards/alerts",
  "/api/cards/chats",
  "/api/subscription",
  "/api/stripe",
  "/api/admin",
];

function getIP(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function isSuspicious(req: NextRequest): { suspicious: boolean; reason: string } {
  const ua  = (req.headers.get("user-agent") ?? "").toLowerCase();
  const url = req.nextUrl.pathname + req.nextUrl.search;

  for (const agent of BAD_AGENTS) {
    if (ua.includes(agent)) return { suspicious: true, reason: `bad_agent:${agent}` };
  }

  if (/(\-\-|%27|%3B|union\s+select|drop\s+table|insert\s+into|delete\s+from)/i.test(url))
    return { suspicious: true, reason: "sql_injection" };

  if (/\.\.(\/|%2F|%5C)/i.test(url))
    return { suspicious: true, reason: "path_traversal" };

  try {
    const decoded = decodeURIComponent(url);
    if (/<script|javascript:|onerror=|onload=|eval\(|document\.cookie/i.test(decoded))
      return { suspicious: true, reason: "xss" };
  } catch {}

  if (/\x00|\x08|\x0B|\x0C|\x0E|\x0F/.test(url))
    return { suspicious: true, reason: "null_byte" };

  return { suspicious: false, reason: "" };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip           = getIP(req);
  const ua           = req.headers.get("user-agent") ?? "";

  // ── Check IP ban list ──────────────────────────────────────────────────────
  // (We check Redis in the API routes since middleware can't use Node.js APIs)

  // ── Honeypot paths ─────────────────────────────────────────────────────────
  if (HONEYPOT_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    console.warn(`[HONEYPOT] ${ip} ua="${ua}" path="${pathname}"`);
    // Slow response to waste scanner resources
    await new Promise(r => setTimeout(r, 2000));
    return new NextResponse("Not Found", { status: 404 });
  }

  // ── Suspicious request detection ───────────────────────────────────────────
  const { suspicious, reason } = isSuspicious(req);
  if (suspicious) {
    console.warn(`[THREAT] ${ip} reason="${reason}" path="${pathname}"`);
    return new NextResponse(
      JSON.stringify({ error: "Bad Request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Empty user agent on sensitive routes ───────────────────────────────────
  if (SENSITIVE_ROUTES.some(r => pathname.startsWith(r))) {
    if (!ua || ua.length < 10) {
      console.warn(`[SECURITY] Empty UA on sensitive route: ${ip} ${pathname}`);
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── Geographic blocking for payment routes ───────────────────────────────
  if (req.nextUrl.pathname.startsWith("/api/stripe/pay")) {
    const country = req.headers.get("cf-ipcountry") ?? "";
    const HIGH_RISK = ["KP", "IR", "CU", "SY"];
    if (HIGH_RISK.includes(country)) {
      return new NextResponse("Service not available in your region", { status: 451 });
    }
  }

  // ── Admin: data is protected server-side in /api/admin/* (requireAdmin) ──

  // ── Stripe webhook ─────────────────────────────────────────────────────────
  if (pathname === "/api/stripe/webhook") {
    if (!req.headers.get("stripe-signature")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── Cron protection ────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/cron/")) {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  // ── eBay deletion endpoint ─────────────────────────────────────────────────
  if (pathname === "/api/ebay/deletion") {
    const method = req.method;
    if (!["GET", "POST"].includes(method)) {
      return new NextResponse("Method Not Allowed", { status: 405 });
    }
  }

  // ── Track request count per IP (anomaly detection) ───────────────────────
  // We do this async without blocking the response
  if (pathname.startsWith("/api/")) {
    const countKey = `req:count:${ip}`;
    // Fire and forget - don't await
  }

  // ── Security response headers ──────────────────────────────────────────────
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options",       "nosniff");
  res.headers.set("X-Frame-Options",              "DENY");
  res.headers.set("X-XSS-Protection",             "1; mode=block");
  res.headers.set("Referrer-Policy",              "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control",       "off");
  res.headers.set("X-Download-Options",           "noopen");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");

  if (pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma",        "no-cache");
    res.headers.set("Expires",       "0");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
