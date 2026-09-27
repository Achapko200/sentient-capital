import { createClient } from "@supabase/supabase-js";

// Verifies the Supabase access token sent as "Authorization: Bearer <token>".
export async function getVerifiedUser(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match  = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token) return null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  );
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error) return null;
  return user;
}
