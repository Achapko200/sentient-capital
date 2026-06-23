// app/api/admin/stats/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const [listings, orders, trades, alerts] = await Promise.all([
      supabaseAdmin.from("listings").select("sold"),
      supabaseAdmin.from("orders").select("status"),
      supabaseAdmin.from("trades").select("id"),
      supabaseAdmin.from("alerts").select("triggered"),
    ]);

    return Response.json({
      stats: {
        totalListings: listings.data?.length ?? 0,
        soldListings:  listings.data?.filter(l => l.sold).length ?? 0,
        totalOrders:   orders.data?.length ?? 0,
        openOrders:    orders.data?.filter(o => o.status === "OPEN").length ?? 0,
        totalTrades:   trades.data?.length ?? 0,
        totalAlerts:   alerts.data?.length ?? 0,
        activeAlerts:  alerts.data?.filter(a => !a.triggered).length ?? 0,
      },
    });
  } catch {
    return Response.json({ stats: null }, { status: 500 });
  }
}