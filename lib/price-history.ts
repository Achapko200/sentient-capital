// Real price history for cards, built from daily snapshots of live eBay prices.
import { supabaseAdmin } from "@/lib/supabase-server";

export type Candle = {
  time: number; timestamp: number; date: string;
  open: number; high: number; low: number; close: number; volume: number;
};

export type Period = { current: number; previous: number; changePct: number; available: boolean };
export type RealPriceHistory = { week: Period; threeMonth: Period; year: Period; available: boolean };

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function recordPriceSnapshot(playerId: string, price: number, listings: number) {
  if (!(price > 0)) return;
  const { error } = await supabaseAdmin.rpc("record_price_snapshot", {
    p_player_id: String(playerId), p_price: round2(price), p_listings: listings,
  });
  if (error) console.error("[price-history] snapshot failed:", error.message);
}

export async function getCandles(playerId: string, days = 180): Promise<Candle[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("price_snapshots")
    .select("day, open, high, low, close, listings")
    .eq("player_id", String(playerId))
    .gte("day", since)
    .order("day", { ascending: true });
  if (error) { console.error("[price-history] candles failed:", error.message); return []; }
  return (data ?? []).map(r => {
    const t = new Date(`${r.day}T12:00:00Z`).getTime();
    return {
      time: Math.floor(t / 1000), timestamp: t,
      date: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open: Number(r.open), high: Number(r.high), low: Number(r.low), close: Number(r.close),
      volume: Number(r.listings ?? 0),
    };
  });
}

export async function getPriceHistory(playerId: string, current: number): Promise<RealPriceHistory> {
  const none = (): Period => ({ current, previous: current, changePct: 0, available: false });
  if (!(current > 0)) return { week: none(), threeMonth: none(), year: none(), available: false };

  const since = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabaseAdmin
    .from("price_snapshots")
    .select("day, close")
    .eq("player_id", String(playerId))
    .gte("day", since)
    .order("day", { ascending: false });
  const rows = data ?? [];

  const period = (daysBack: number): Period => {
    const cutoff = new Date(Date.now() - daysBack * 86_400_000).toISOString().slice(0, 10);
    const past   = rows.find(r => r.day <= cutoff);   // newest snapshot at least `daysBack` old
    if (!past) return none();
    const previous = Number(past.close);
    if (!(previous > 0)) return none();
    return { current, previous, changePct: Math.round(((current - previous) / previous) * 1000) / 10, available: true };
  };

  const week = period(7), threeMonth = period(90), year = period(365);
  return { week, threeMonth, year, available: week.available };
}
