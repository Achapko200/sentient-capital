// app/api/admin/alerts/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("alerts")
      .select()
      .order("created_at", { ascending: false })
      .limit(100);

    return Response.json({ alerts: data ?? [] });
  } catch {
    return Response.json({ alerts: [] }, { status: 500 });
  }
}