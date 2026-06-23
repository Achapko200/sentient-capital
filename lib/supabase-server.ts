import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local");
}

// Admin client — bypasses RLS, only use in API routes
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession:     false,
    autoRefreshToken:   false,
  },
});