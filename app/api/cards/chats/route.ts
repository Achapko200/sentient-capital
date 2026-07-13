import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return Response.json({ chats: [] });

  const { data } = await supabaseAdmin
    .from("ai_chats")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  return Response.json({ chats: data ?? [] });
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const { action, userId, chatId, title, messages } = await req.json();

  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "create") {
    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .insert({ user_id: userId, title: title ?? "New chat", messages: messages ?? [] })
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ chat: data });
  }

  if (action === "update") {
    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .update({ messages, title, updated_at: new Date().toISOString() })
      .eq("id", chatId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ chat: data });
  }

  if (action === "delete") {
    await supabaseAdmin
      .from("ai_chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}