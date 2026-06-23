// app/api/admin/orders/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("orders")
      .select()
      .order("created_at", { ascending: false })
      .limit(100);

    return Response.json({ orders: data ?? [] });
  } catch {
    return Response.json({ orders: [] }, { status: 500 });
  }
}