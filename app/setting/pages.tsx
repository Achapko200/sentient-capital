// ─── app/settings/page.tsx ───────────────────────────────────────────────────
"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [interval,   setInterval]   = useState(2);
  const [maxPos,     setMaxPos]     = useState(20);
  const [riskLevel,  setRiskLevel]  = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [autonomy,   setAutonomy]   = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-1">Settings</h1>
        <p className="text-slate-400">Configure AURA Fund behavior and risk parameters.</p>
      </div>

      <div className="max-w-2xl space-y-4">

        {/* Execution interval */}
        <div className="rounded-xl border border-slate-800 bg-[#0B1020] p-5">
          <p className="text-white font-medium mb-1">Execution Interval</p>
          <p className="text-slate-400 text-sm mb-3">How often agents re-evaluate positions (seconds).</p>
          <div className="flex items-center gap-4">
            <input type="range" min={1} max={10} value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="flex-1 accent-blue-500" />
            <span className="text-white font-mono w-8">{interval}s</span>
          </div>
        </div>

        {/* Max position size */}
        <div className="rounded-xl border border-slate-800 bg-[#0B1020] p-5">
          <p className="text-white font-medium mb-1">Max Position Size</p>
          <p className="text-slate-400 text-sm mb-3">Maximum % of portfolio in any single asset.</p>
          <div className="flex items-center gap-4">
            <input type="range" min={5} max={40} step={5} value={maxPos}
              onChange={(e) => setMaxPos(Number(e.target.value))}
              className="flex-1 accent-blue-500" />
            <span className="text-white font-mono w-10">{maxPos}%</span>
          </div>
        </div>

        {/* Risk level */}
        <div className="rounded-xl border border-slate-800 bg-[#0B1020] p-5">
          <p className="text-white font-medium mb-3">Risk Appetite</p>
          <div className="flex gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
              <button key={level}
                onClick={() => setRiskLevel(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  riskLevel === level
                    ? level === "LOW"    ? "bg-green-600 text-white"
                    : level === "MEDIUM" ? "bg-yellow-600 text-white"
                    : "bg-red-600 text-white"
                    : "border border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Autonomy toggle */}
        <div className="rounded-xl border border-slate-800 bg-[#0B1020] p-5 flex justify-between items-center">
          <div>
            <p className="text-white font-medium">Full Autonomy Mode</p>
            <p className="text-slate-400 text-sm">Allow agents to execute trades without confirmation.</p>
          </div>
          <button
            onClick={() => setAutonomy(!autonomy)}
            className={`relative w-12 h-6 rounded-full transition-colors ${autonomy ? "bg-purple-600" : "bg-slate-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autonomy ? "translate-x-6" : ""}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
