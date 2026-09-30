"use client";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./adminFetch";

type Check = { name: string; status: "ok" | "warn" | "down"; detail: string };
const DOT = { ok: "#12B76A", warn: "#F79009", down: "#F04438" };
const LABEL = { ok: "Operational", warn: "Attention", down: "Down" };

export default function PlatformHealth() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [at, setAt] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const d = await (await adminFetch("/api/admin/platform-health")).json();
      setChecks(d.checks ?? []); setAt(d.checkedAt ?? "");
    } catch { setChecks([]); }
    setBusy(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const worst = checks?.some(c => c.status === "down") ? "down" : checks?.some(c => c.status === "warn") ? "warn" : "ok";

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Platform health</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {checks ? <>Overall: <span style={{ color: DOT[worst] }}>{LABEL[worst]}</span></> : "Running checks…"}
            {at && <> · checked {new Date(at).toLocaleTimeString()}</>}
          </p>
        </div>
        <button onClick={load} disabled={busy}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50">
          {busy ? "Checking…" : "Re-check"}
        </button>
      </div>
      <div className="divide-y divide-gray-800">
        {(checks ?? Array.from({ length: 7 }).map(() => null)).map((c, i) => (
          <div key={i} className="flex items-center justify-between py-3 gap-4">
            {c ? (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.detail}</p>
                </div>
                <span className="flex items-center gap-2 text-xs font-semibold shrink-0" style={{ color: DOT[c.status] }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DOT[c.status] }} />{LABEL[c.status]}
                </span>
              </>
            ) : <div className="h-8 w-full rounded bg-gray-800/60 animate-pulse" />}
          </div>
        ))}
      </div>
    </section>
  );
}
