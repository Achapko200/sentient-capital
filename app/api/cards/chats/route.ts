import { supabaseAdmin }   from "@/lib/supabase-server";
import { checkRateLimit }  from "@/lib/ratelimit";
import { getVerifiedUser } from "@/lib/verify-user";

const MAX_TITLE_LEN   = 120;
const MAX_MESSAGES    = 200;
const MAX_MESSAGE_LEN = 8_000;
const MAX_BODY_BYTES  = 256_000;
const ID_RE           = /^[A-Za-z0-9-]{1,64}$/;

type ChatMessage = { role: "user" | "assistant"; content: string };

function cleanTitle(raw: unknown): string {
  const t = typeof raw === "string" ? raw.replace(/[\u0000-\u001F\u007F]/g, "").trim() : "";
  return (t || "New chat").slice(0, MAX_TITLE_LEN);
}

function cleanMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.length > MAX_MESSAGE_LEN) return null;
    out.push({ role, content });
  }
  return out;
}

const serverError = (where: string, err: unknown) => {
  console.error(`[api/chats] ${where}:`, err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
};

// GET: list chats, or one chat with ?id=
export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    if (!ID_RE.test(id)) return Response.json({ error: "Invalid chat id" }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .select("id, title, messages, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return serverError("get", error);
    if (!data)  return Response.json({ error: "Chat not found" }, { status: 404 });
    return Response.json({ chat: data });
  }

  const { data, error } = await supabaseAdmin
    .from("ai_chats")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) return serverError("list", error);
  return Response.json({ chats: data ?? [] });
}

// POST: create or update a chat
export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return Response.json({ error: "Payload too large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title    = cleanTitle(body?.title);
  const messages = cleanMessages(body?.messages);
  if (!messages) return Response.json({ error: "Invalid messages" }, { status: 400 });

  const chatId = body?.chatId;
  if (chatId !== undefined && chatId !== null) {
    if (typeof chatId !== "string" || !ID_RE.test(chatId)) {
      return Response.json({ error: "Invalid chat id" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .update({ title, messages, updated_at: new Date().toISOString() })
      .eq("id", chatId)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();
    if (error) return serverError("update", error);
    if (!data)  return Response.json({ error: "Chat not found" }, { status: 404 });
    return Response.json({ chat: data });
  }

  const { data, error } = await supabaseAdmin
    .from("ai_chats")
    .insert({ user_id: user.id, title, messages })
    .select()
    .single();
  if (error) return serverError("insert", error);
  return Response.json({ chat: data });
}

// DELETE: remove one of the user's chats
export async function DELETE(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const user = await getVerifiedUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const chatId = new URL(req.url).searchParams.get("id");
  if (!chatId || !ID_RE.test(chatId)) return Response.json({ error: "Invalid chat id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("ai_chats").delete().eq("id", chatId).eq("user_id", user.id);
  if (error) return serverError("delete", error);
  return Response.json({ ok: true });
}
