import { supabaseAdmin }              from "@/lib/supabase-server";
import { fetchEbaySales, calcAvgPrice } from "@/lib/ebay";

export async function GET(req: Request) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all untriggered alerts
    const { data: alerts } = await supabaseAdmin
      .from("alerts")
      .select("*")
      .eq("triggered", false);

    if (!alerts || alerts.length === 0) {
      return Response.json({ checked: 0, triggered: 0 });
    }

    let triggered = 0;

    for (const alert of alerts) {
      try {
        // Get current price from eBay
        const sales       = await fetchEbaySales(alert.card_id, alert.player_name);
        const currentPrice = calcAvgPrice(sales) || alert.target_price;

        const shouldTrigger =
          (alert.direction === "ABOVE" && currentPrice >= alert.target_price) ||
          (alert.direction === "BELOW" && currentPrice <= alert.target_price);

        if (shouldTrigger) {
          // Mark as triggered
          await supabaseAdmin
            .from("alerts")
            .update({ triggered: true })
            .eq("id", alert.id);

          // Send email if provided
          if (alert.email && process.env.RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method:  "POST",
              headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from:    "Card Tracker <onboarding@resend.dev>",
                to:      [alert.email],
                subject: `🔔 Price Alert: ${alert.player_name} ${alert.direction === "ABOVE" ? "above" : "below"} $${alert.target_price}`,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
                    
                    <!-- Header -->
                    <div style="background: #0d0d0d; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 28px;">⚾</span>
                        <span style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">Card Tracker</span>
                      </div>
                    </div>

                    <!-- Body -->
                    <div style="padding: 32px; background: #111111; border-radius: 0 0 12px 12px;">
                      
                      <!-- Alert badge -->
                      <div style="display: inline-block; background: ${alert.direction === "ABOVE" ? "#0a2e1a" : "#2e0a0a"}; border: 1px solid ${alert.direction === "ABOVE" ? "#00c278" : "#ff3b30"}; border-radius: 20px; padding: 6px 14px; margin-bottom: 20px;">
                        <span style="color: ${alert.direction === "ABOVE" ? "#00c278" : "#ff3b30"}; font-size: 12px; font-weight: 800;">🔔 PRICE ALERT TRIGGERED</span>
                      </div>

                      <!-- Player name -->
                      <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0 0 4px 0; letter-spacing: -0.5px;">${alert.player_name}</h1>
                      <p style="color: #888888; font-size: 14px; margin: 0 0 24px 0;">PSA 10 Rookie Card</p>

                      <!-- Price box -->
                      <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                          <span style="color: #888888; font-size: 13px;">Current Market Price</span>
                          <span style="color: #00c278; font-size: 24px; font-weight: 900;">$${currentPrice.toFixed(2)}</span>
                        </div>
                        <div style="border-top: 1px solid #2a2a2a; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                          <span style="color: #888888; font-size: 13px;">Your Target</span>
                          <span style="color: #ffffff; font-size: 14px; font-weight: 700;">${alert.direction === "ABOVE" ? "📈 Above" : "📉 Below"} $${alert.target_price}</span>
                        </div>
                      </div>

                      <!-- CTA -->
                      <a href="https://sentient-capital.vercel.app/app" 
                         style="display: block; background: #00c278; color: #000000; text-align: center; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 900; font-size: 15px; margin-bottom: 24px;">
                        View Card & Trade Now →
                      </a>

                      <!-- Footer -->
                      <p style="color: #555555; font-size: 12px; text-align: center; margin: 0;">
                        You're receiving this because you set a price alert on Card Tracker.<br/>
                        <a href="https://sentient-capital.vercel.app/app" style="color: #555555;">Manage alerts</a>
                      </p>
                    </div>
                  </div>
                `,
              }),
            });
          }

          // Send push notification
          const { data: pushSub } = await supabaseAdmin
            .from("push_subscriptions")
            .select("subscription")
            .eq("user_id", alert.wallet)
            .single();

          if (pushSub) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                action:  "notify",
                userId:  alert.wallet,
                title:   `🔔 ${alert.player_name} Alert Triggered!`,
                body:    `Price is now $${currentPrice.toFixed(2)} — ${alert.direction === "ABOVE" ? "above" : "below"} your $${alert.target_price} target`,
                url:     "/app",
              }),
            });
          }

          triggered++;
        }
      } catch {
        // Skip failed alerts
      }
    }

    return Response.json({ checked: alerts.length, triggered });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
