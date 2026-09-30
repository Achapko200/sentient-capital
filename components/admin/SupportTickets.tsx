"use client";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./adminFetch";

type Ticket = { id: string; created_at: string; name: string | null; email: string; topic: string; message: string; status: "open" | "resolved"; resolved_at: string | null; email_sent: boolean };
const ref = (id: string) => `CT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function SupportTickets() {
  const [filter, setFilter]   = useState<"open" | "resolved" | "all">("open");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [openCount, setOpen]  = useState(0);
  const [expanded, setExp]    = useState<string | null>(null);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const r = await adminFetch(`/api/admin/support${filter === "all" ? "" : `?status=${filter}`}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to load");
      setTickets(d.tickets); setOpen(d.openCount);
    } catch (e: any) { setError(e.message); setTickets([]); }
  }, [filter]);
  useEffect(() => { setTickets(null); load(); }, [load]);

  async function setStatus(id: string, status: "open" | "resolved") {
    const r = await adminFetch("/api/admin/support", { method: "PATCH", body: JSON.stringify({ id, status }) });
    if (r.ok) load(); else setError((await r.json()).error ?? "Update failed");
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold">Support tickets</h2>
          <p className="text-xs text-gray-500 mt-0.5">{openCount} open</p>
        </div>
        <div className="flex rounded-lg border border-gray-700 p-0.5">
          {(["open", "resolved", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize ${filter === f ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {tickets === null && <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-800/60 animate-pulse" />)}</div>}
      {tickets?.length === 0 && !error && <p className="text-sm text-gray-500 py-6 text-center">No {filter === "all" ? "" : filter} tickets.</p>}

      <div className="space-y-2">
        {tickets?.map(t => {
          const open = expanded === t.id;
          const subject = encodeURIComponent(`Re: Support Ticket ${ref(t.id)} · ${t.topic}`);
          return (
            <div key={t.id} className="rounded-xl border border-gray-800 bg-gray-950/60">
              <button onClick={() => setExp(open ? null : t.id)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${t.status === "open" ? "bg-amber-500/15 text-amber-400" : "bg-green-500/15 text-green-400"}`}>{t.status}</span>
                <span className="text-xs font-mono text-gray-400 shrink-0">{ref(t.id)}</span>
                <span className="text-sm font-semibold text-gray-100 truncate">{t.topic}</span>
                <span className="text-xs text-gray-500 truncate hidden sm:inline">· {t.name || t.email}</span>
                <span className="ml-auto text-xs text-gray-500 shrink-0">{when(t.created_at)}</span>
              </button>
              {open && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-500 mb-2">{t.name ? `${t.name} · ` : ""}{t.email}{!t.email_sent && " · ⚠ notification email failed"}</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap rounded-lg bg-gray-900 border border-gray-800 p-3">{t.message}</p>
                  <div className="flex gap-2 mt-3">
                    <a href={`mailto:${t.email}?subject=${subject}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500">Reply</a>
                    {t.status === "open"
                      ? <button onClick={() => setStatus(t.id, "resolved")} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800">Mark resolved</button>
                      : <button onClick={() => setStatus(t.id, "open")} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800">Reopen</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
