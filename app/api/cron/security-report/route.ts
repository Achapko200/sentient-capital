import { getPlatformSecurityScore } from "@/lib/security-monitor";
import { Redis }                    from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [score, bannedIPs, eventCount, recentEvents] = await Promise.all([
    getPlatformSecurityScore(),
    redis.keys("banned:ip:*"),
    redis.llen("audit:log"),
    redis.lrange("audit:log", 0, 9),
  ]);

  const criticalEvents = (recentEvents as string[])
    .map(e => JSON.parse(e))
    .filter(e => ["AUTH_FAILURE", "IP_AUTO_BANNED", "SUSPICIOUS_REQUEST"].includes(e.event));

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    "Card Tracker Security <onboarding@resend.dev>",
        to:      [(process.env.ADMIN_NOTIFY_EMAIL ?? "achapko22@gmail.com")],
        subject: `🔐 Weekly Security Report — Card Tracker`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; color: #fff; padding: 32px; border-radius: 12px;">
            <h2 style="color: #00c278;">🔐 Weekly Security Report</h2>
            <p style="color: #888;">Card Tracker · ${new Date().toLocaleDateString()}</p>
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #fff; margin: 0 0 16px 0;">Platform Security Score</h3>
              <div style="font-size: 48px; font-weight: 900; color: ${score.score >= 80 ? "#00c278" : score.score >= 60 ? "#f59e0b" : "#ff3b30"};">
                ${score.score}/100
              </div>
            </div>
            <div style="margin: 20px 0;">
              <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <p style="color: #888; margin: 0;">Blocked IPs</p>
                <p style="color: #ff3b30; font-size: 24px; font-weight: 900; margin: 4px 0;">${bannedIPs.length}</p>
              </div>
              <div style="background: #1a1a1a; padding: 16px; border-radius: 8px;">
                <p style="color: #888; margin: 0;">Security Events</p>
                <p style="color: #fff; font-size: 24px; font-weight: 900; margin: 4px 0;">${eventCount}</p>
              </div>
            </div>
            ${criticalEvents.length > 0 ? `
            <div style="background: #2e0a0a; border: 1px solid #ff3b30; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ff3b30; margin: 0 0 12px 0;">⚠️ Critical Events (${criticalEvents.length})</h3>
              ${criticalEvents.slice(0, 5).map((e: any) => `
                <div style="border-top: 1px solid #3a1a1a; padding: 8px 0;">
                  <p style="color: #fff; margin: 0; font-size: 13px;">${e.event} — ${e.timestamp}</p>
                </div>
              `).join("")}
            </div>
            ` : `
            <div style="background: #0a2e1a; border: 1px solid #00c278; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #00c278; margin: 0;">✅ No critical security events this period</p>
            </div>
            `}
            <a href="https://sentient-capital.vercel.app/admin"
               style="display: block; background: #2563eb; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 900;">
              View Full Security Dashboard →
            </a>
          </div>
        `,
      }),
    });
  }

  return Response.json({ sent: true, score, bannedIPs: bannedIPs.length });
}
