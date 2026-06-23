import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables — check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:     true,  // needed for email auth
    autoRefreshToken:   true,
    detectSessionInUrl: true,  // needed for password reset links
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});