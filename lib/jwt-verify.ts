import { createClient } from "@supabase/supabase-js";

export async function verifySessionToken(token: string) {
  if (!token) return null;
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch { return null; }
}

export async function requireAuth(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const user  = await verifySessionToken(token);
  if (!user) {
    return { user: null, error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) };
  }
  return { user, error: null };
}
