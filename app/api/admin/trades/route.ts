// app/api/admin/trades/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("trades")
      .select()
      .order("executed_at", { ascending: false })
      .limit(100);

    const trades = (data ?? []).map((t: any) => ({
      id:         t.id,
      cardId:     t.card_id,
      price:      t.price,
      shares:     t.shares,
      buyWallet:  t.buy_wallet,
      sellWallet: t.sell_wallet,
      executedAt: t.executed_at,
    }));

    return Response.json({ trades });
  } catch {
    return Response.json({ trades: [] }, { status: 500 });
  }
}