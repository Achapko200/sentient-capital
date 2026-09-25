import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/ratelimit";
import { createClient }   from "@supabase/supabase-js";

function getUserClient(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function getVerifiedUser(req: Request) {
  const userClient = getUserClient(req);
  const { data: { user } } = await userClient.auth.getUser();
  return user;
}

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("ai_chats")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return Response.json({ chats: data ?? [] });
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { chatId, title, messages } = body;

  if (chatId) {
    const { data } = await supabaseAdmin
      .from("ai_chats")
      .update({ title, messages, updated_at: new Date().toISOString() })
      .eq("id", chatId)
      .eq("user_id", user.id)
      .select()
      .single();
    return Response.json({ chat: data });
  }

  const { data } = await supabaseAdmin
    .from("ai_chats")
    .insert({ user_id: user.id, title, messages })
    .select()
    .single();

  return Response.json({ chat: data });
}

export async function DELETE(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("id");
  if (!chatId) return Response.json({ error: "Missing id" }, { status: 400 });

  await supabaseAdmin.from("ai_chats").delete().eq("id", chatId).eq("user_id", user.id);
  return Response.json({ ok: true });
}
