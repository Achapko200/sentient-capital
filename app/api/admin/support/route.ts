// Admin: list support tickets and update their status.
import { requireAdmin }  from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
const STATUSES = ["open", "resolved"];

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const status = new URL(req.url).searchParams.get("status");
  let q = supabaseAdmin.from("support_requests")
    .select("id, created_at, name, email, topic, message, status, resolved_at, email_sent")
    .order("created_at", { ascending: false }).limit(200);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const { count: open } = await supabaseAdmin.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "open");
  return Response.json({ tickets: data ?? [], openCount: open ?? 0 });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  const id = String(body?.id ?? ""), status = String(body?.status ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.includes(status)) return Response.json({ error: "Invalid ticket or status" }, { status: 400 });
  const { error } = await supabaseAdmin.from("support_requests")
    .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
