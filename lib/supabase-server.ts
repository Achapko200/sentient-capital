import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY — admin routes will fail");
}

export const supabaseAdmin = createClient(url, key ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});