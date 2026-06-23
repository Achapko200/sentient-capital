// ─── lib/alerts.ts ───────────────────────────────────────────────────────────
import { supabaseAdmin } from "@/lib/supabase-server";

export type Alert = {
  id:          string;
  wallet:      string;
  cardId:      string;
  playerName:  string;
  targetPrice: number;
  direction:   "ABOVE" | "BELOW";
  email:       string | null;
  triggered:   boolean;
  createdAt:   string;
};

export async function createAlert(
  wallet: string, cardId: string, playerName: string,
  targetPrice: number, direction: "ABOVE" | "BELOW", email?: string,
): Promise<Alert> {
  const alert = {
    id:           `alt_${Date.now()}`,
    wallet,
    card_id:      cardId,
    player_name:  playerName,
    target_price: targetPrice,
    direction,
    email:        email ?? null,
    triggered:    false,
    created_at:   new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("alerts").insert(alert);
  if (error) throw new Error(error.message);
  return {
    id: alert.id, wallet, cardId, playerName,
    targetPrice, direction, email: alert.email,
    triggered: false, createdAt: alert.created_at,
  };
}

export async function getAlerts(wallet: string): Promise<Alert[]> {
  const { data, error } = await supabaseAdmin
    .from("alerts")
    .select()
    .eq("wallet", wallet)
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map(a => ({
    id:          a.id,
    wallet:      a.wallet,
    cardId:      a.card_id,
    playerName:  a.player_name,
    targetPrice: a.target_price,
    direction:   a.direction,
    email:       a.email,
    triggered:   a.triggered,
    createdAt:   a.created_at,
  }));
}

export async function deleteAlert(id: string, wallet: string): Promise<void> {
  // Wallet check ensures users can only delete their own alerts
  const { error } = await supabaseAdmin
    .from("alerts")
    .delete()
    .eq("id", id)
    .eq("wallet", wallet);
  if (error) throw new Error(error.message);
}

export async function checkAlerts(cardId: string, currentPrice: number): Promise<void> {
  const { data: alerts } = await supabaseAdmin
    .from("alerts")
    .select()
    .eq("card_id", cardId)
    .eq("triggered", false);

  for (const alert of alerts ?? []) {
    const triggered =
      (alert.direction === "ABOVE" && currentPrice >= alert.target_price) ||
      (alert.direction === "BELOW" && currentPrice <= alert.target_price);

    if (triggered) {
      await supabaseAdmin
        .from("alerts")
        .update({ triggered: true })
        .eq("id", alert.id);
      if (alert.email) await sendAlertEmail(alert, currentPrice);
    }
  }
}

async function sendAlertEmail(alert: any, currentPrice: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:    "alerts@cardtracker.app",
      to:      alert.email,
      subject: `🚨 ${alert.player_name} card hit $${currentPrice}`,
      html: `
        <h2>Price Alert Triggered</h2>
        <p><strong>${alert.player_name}</strong> share price hit <strong>$${currentPrice}</strong></p>
        <p>Your alert: ${alert.direction === "ABOVE" ? "above" : "below"} $${alert.target_price}</p>
        <a href="https://sentient-capital.vercel.app">View on Card Tracker →</a>
      `,
    }),
  });
}