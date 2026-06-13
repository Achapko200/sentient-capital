"use client";

// ─── Sidebar.tsx ──────────────────────────────────────────────────────────────

import { useState } from "react";
import NavLinks     from "@/components/NavLinks";

type Status = "idle" | "running" | "done" | "error";

export default function Sidebar() {
  const [analysisStatus,  setAnalysisStatus]  = useState<Status>("idle");
  const [shockStatus,     setShockStatus]     = useState<Status>("idle");
  const [autonomyStatus,  setAutonomyStatus]  = useState<Status>("idle");

  const callApi = async (
    path: string,
    setter: (s: Status) => void,
  ) => {
    setter("running");
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error();
      setter("done");
      setTimeout(() => setter("idle"), 3000);
    } catch {
      setter("error");
      setTimeout(() => setter("idle"), 3000);
    }
  };

  const btnLabel = (label: string, status: Status) => {
    if (status === "running") return "Running…";
    if (status === "done")    return "✓ Done";
    if (status === "error")   return "Error";
    return label;
  };

  const btnClass = (base: string, status: Status) =>
    `${base} w-full py-2 px-3 rounded text-sm font-medium transition ${
      status === "running" ? "opacity-60 cursor-wait" :
      status === "done"    ? "!bg-green-600" :
      status === "error"   ? "!bg-red-700" : ""
    }`;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 p-4 space-y-6 bg-[#050814] text-white flex flex-col">

      {/* Fund status */}
      <div>
        <p className="text-xs text-slate-500 mb-1">FUND MODE</p>
        <p className="font-medium text-white">Autonomous Portfolio</p>
        <p className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          ACTIVE
        </p>
      </div>

      {/* Agents */}
      <div>
        <p className="text-xs text-slate-500 mb-2">AI AGENTS</p>
        <div className="space-y-1.5 text-sm">
          {["research.aura.eth", "quant.aura.eth", "risk.aura.eth"].map((ens) => (
            <div key={ens} className="flex items-center gap-2 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="font-mono text-xs">{ens}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div>
        <p className="text-xs text-slate-500 mb-2">NAVIGATION</p>
        <NavLinks />
      </div>

      {/* Controls */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <p className="text-xs text-slate-500 mb-2">CONTROLS</p>
        <button
          onClick={() => callApi("/api/analyze", setAnalysisStatus)}
          disabled={analysisStatus === "running"}
          className={btnClass("bg-blue-600 hover:bg-blue-500", analysisStatus)}
        >
          {btnLabel("Run Analysis", analysisStatus)}
        </button>
        <button
          onClick={() => callApi("/api/analyze/risk", setShockStatus)}
          disabled={shockStatus === "running"}
          className={btnClass("border border-slate-700 hover:border-red-500 hover:text-red-400", shockStatus)}
        >
          {btnLabel("Market Shock", shockStatus)}
        </button>
        <button
          onClick={() => callApi("/api/analyze/loop/start", setAutonomyStatus)}
          disabled={autonomyStatus === "running"}
          className={btnClass("bg-purple-600 hover:bg-purple-500", autonomyStatus)}
        >
          {btnLabel("Enable Autonomy", autonomyStatus)}
        </button>
      </div>

    </aside>
  );
}
