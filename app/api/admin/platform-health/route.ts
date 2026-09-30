// Live platform checks for the admin dashboard.
import { requireAdmin }  from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getEbayUsage }  from "@/lib/ebay-budget";

export const dynamic = "force-dynamic";

type Check = { name: string; status: "ok" | "warn" | "down"; detail: string };

async function timed<T>(fn: () => Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([fn(), new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const today = new Date().toISOString().slice(0, 10);

  const checks = await Promise.all<Promise<Check>>([
    // MLB
    (async () => {
      try {
        const t0 = Date.now();
        const r = await timed(() => fetch("https://statsapi.mlb.com/api/v1/teams?sportId=1&fields=teams,id", { cache: "no-store" }));
        const n = (await r.json()).teams?.length ?? 0;
        return { name: "MLB Stats API", status: r.ok && n ? "ok" : "down", detail: r.ok ? `${n} teams · ${Date.now() - t0} ms` : `HTTP ${r.status}` };
      } catch (e: any) { return { name: "MLB Stats API", status: "down", detail: e.message }; }
    })(),
    // ESPN
    (async () => {
      try {
        const r = await timed(() => fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news", { cache: "no-store" }));
        const n = (await r.json()).articles?.length ?? 0;
        return { name: "ESPN News", status: r.ok && n ? "ok" : "warn", detail: r.ok ? `${n} headlines available` : `HTTP ${r.status}` };
      } catch (e: any) { return { name: "ESPN News", status: "down", detail: e.message }; }
    })(),
    // Supabase
    (async () => {
      try {
        const t0 = Date.now();
        const { error } = await timed(async () => await supabaseAdmin.from("support_requests").select("id", { count: "exact", head: true }));
        return { name: "Supabase database", status: error ? "down" : "ok", detail: error ? error.message : `Query OK · ${Date.now() - t0} ms` };
      } catch (e: any) { return { name: "Supabase database", status: "down", detail: e.message }; }
    })(),
    // eBay
    (async () => {
      try {
        const { used, cap } = await getEbayUsage();
        const { count } = await supabaseAdmin.from("card_market_cache").select("player_id", { count: "exact", head: true }).gt("price", 0);
        const pct = cap ? used / cap : 0;
        const keys = !!process.env.EBAY_APP_ID && !!process.env.EBAY_CERT_ID;
        return {
          name: "eBay prices (live)",
          status: !keys ? "down" : pct >= 1 ? "down" : pct >= 0.8 ? "warn" : "ok",
          detail: !keys ? "eBay keys missing" : `${used.toLocaleString()} / ${cap.toLocaleString()} searches today · ${count ?? 0} cards priced`,
        };
      } catch (e: any) { return { name: "eBay prices (live)", status: "warn", detail: e.message }; }
    })(),
    // Daily price job
    (async () => {
      try {
        const { data } = await supabaseAdmin.from("price_snapshots").select("day").order("day", { ascending: false }).limit(1);
        const last = data?.[0]?.day as string | undefined;
        const { count } = last ? await supabaseAdmin.from("price_snapshots").select("player_id", { count: "exact", head: true }).eq("day", last) : { count: 0 };
        const ageDays = last ? Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000) : 99;
        return {
          name: "Daily price job",
          status: !last ? "down" : ageDays <= 1 ? "ok" : "warn",
          detail: last ? `Last saved ${last} · ${count ?? 0} prices` : "No saved prices yet",
        };
      } catch (e: any) { return { name: "Daily price job", status: "warn", detail: e.message }; }
    })(),
    // Email
    (async () => {
      const key = !!process.env.RESEND_API_KEY, inbox = process.env.SUPPORT_EMAIL, domain = !!process.env.RESEND_FROM;
      const { data } = await supabaseAdmin.from("support_requests").select("email_sent").order("created_at", { ascending: false }).limit(1);
      const lastOk = data?.[0]?.email_sent;
      return {
        name: "Email (Resend)",
        status: !key || !inbox ? "down" : lastOk === false ? "warn" : domain ? "ok" : "warn",
        detail: !key ? "RESEND_API_KEY missing" : !inbox ? "SUPPORT_EMAIL missing"
              : `${lastOk === false ? "Last support email failed · " : ""}${domain ? "Customer emails on" : "Test sender: only delivers to your inbox"}`,
      };
    })(),
    // Stripe
    (async () => {
      const k = process.env.STRIPE_SECRET_KEY ?? "";
      const mode = k.startsWith("sk_live_") ? "Live mode" : k.startsWith("sk_test_") ? "Test mode" : null;
      return { name: "Stripe payments", status: !mode ? "down" : mode === "Live mode" ? "ok" : "warn",
               detail: mode ? `${mode}${process.env.STRIPE_WEBHOOK_SECRET ? " · webhook configured" : " · webhook secret missing"}` : "STRIPE_SECRET_KEY missing" };
    })(),
  ]);

  return Response.json({ checkedAt: new Date().toISOString(), checks });
}
