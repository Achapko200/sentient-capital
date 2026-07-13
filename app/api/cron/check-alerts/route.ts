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
        const sales       = await fetchEbaySales(alert.card_id, alert.player_name, alert.target_price);
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
                from:    "Card Tracker <alerts@cardtracker.app>",
                to:      [alert.email],
                subject: `🔔 Price Alert: ${alert.player_name} ${alert.direction === "ABOVE" ? "above" : "below"} $${alert.target_price}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2>⚾ Card Tracker Price Alert</h2>
                    <p>Your price alert for <strong>${alert.player_name}</strong> has been triggered!</p>
                    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                      <p><strong>Current Price:</strong> $${currentPrice.toFixed(2)}</p>
                      <p><strong>Your Target:</strong> ${alert.direction === "ABOVE" ? "Above" : "Below"} $${alert.target_price}</p>
                    </div>
                    <a href="https://sentient-capital.vercel.app/app" 
                       style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                      View on Card Tracker
                    </a>
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
