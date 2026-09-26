// Real-time security alerts via email for critical events

export async function sendSecurityAlert(
  event:   string,
  details: Record<string, any>,
  severity: "low" | "medium" | "high" | "critical"
) {
  if (severity === "low") return; // Don't alert on low severity

  const colors = {
    medium:   "#f59e0b",
    high:     "#ff6b35",
    critical: "#ff3b30",
  };

  const color = colors[severity];

  try {
    await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    "Card Tracker Security <onboarding@resend.dev>",
        to:      ["anna.chapko.2004@gmail.com"],
        subject: `🚨 [${severity.toUpperCase()}] Security Alert: ${event}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background: ${color}; padding: 16px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🚨 Security Alert</h2>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">
                Severity: ${severity.toUpperCase()}
              </p>
            </div>
            <div style="background: #1a1a1a; padding: 24px; border-radius: 0 0 8px 8px;">
              <h3 style="color: #fff; margin: 0 0 16px 0;">${event}</h3>
              <pre style="background: #0d0d0d; color: #00c278; padding: 16px; border-radius: 8px; overflow: auto; font-size: 12px;">
${JSON.stringify(details, null, 2)}
              </pre>
              <p style="color: #888; font-size: 12px; margin: 16px 0 0 0;">
                Time: ${new Date().toISOString()}
              </p>
              <a href="https://sentient-capital.vercel.app/admin"
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 16px;">
                View Dashboard →
              </a>
            </div>
          </div>
        `,
      }),
    });
  } catch {}
}
