// app/api/admin/orders/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
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