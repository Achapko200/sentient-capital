// app/api/admin/alerts/route.ts
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
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