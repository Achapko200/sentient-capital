// app/api/admin/trades/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
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