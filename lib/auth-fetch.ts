// fetch() that attaches the signed-in user's Supabase token, for APIs that require login.
import { supabase } from "@/lib/supabase";
export async function authFetch(input: string, init: RequestInit = {}) {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
