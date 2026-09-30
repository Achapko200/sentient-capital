import { supabase } from "@/lib/supabase";
export async function adminFetch(url: string, init: RequestInit = {}) {
  const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
  return fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
}
