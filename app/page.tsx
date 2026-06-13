"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [ai, setAi] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [autonomy, setAutonomy] = useState(false);
  const [shock, setShock] = useState(false);

  const runAnalysis = async (type: "normal" | "shock" = "normal") => {
    setLoading(true);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolio: {
          NVDA: 35,
          MSFT: 25,
          AAPL: 20,
          CASH: 20,
        },
        mode: type,
      }),
    });

    const data = await res.json();
    setAi(data);

    setLog((prev) => [
      type === "shock"
        ? `[MARKET SHOCK] Volatility event triggered`
        : `[AI] ${data.thesis}`,
      `[RISK] ${data.risk}`,
      `[TRADE] ${data.trades?.[0] ?? "No action"}`,
      ...prev,
    ]);

    setLoading(false);
  };

  // AUTONOMY LOOP
  useEffect(() => {
    if (!autonomy) return;

    const interval = setInterval(() => {
      runAnalysis("normal");
    }, 5000);

    return () => clearInterval(interval);
  }, [autonomy]);

  return (
    <div className="min-h-screen bg-[#04060A] text-white flex flex-col">

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-[#050814]">
        <div>
          <h1 className="font-semibold tracking-wide">
            🧠 Sentient Portfolio OS
          </h1>
          <p className="text-xs text-slate-500">
            Autonomous AI Capital Management System
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
            ● LIVE MARKET SYNC
          </span>
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            AI AGENTS ONLINE
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1">

        {/* LEFT PANEL */}
        <aside className="w-60 border-r border-slate-800 p-4 space-y-6 bg-[#050814]">

          <div className="space-y-1 text-sm">
            <p className="text-slate-500 text-xs">PORTFOLIO MODE</p>
            <p className="font-medium">Autonomous Trading</p>
            <p className="text-green-400 text-xs">Active Strategy</p>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <p className="text-slate-500">AGENTS</p>
            <p>Analyst → ACTIVE</p>
            <p>Risk Engine → ACTIVE</p>
            <p>Execution → READY</p>
          </div>

          <button
            onClick={() => runAnalysis("normal")}
            className="w-full px-3 py-2 text-xs rounded bg-blue-600 hover:bg-blue-500"
          >
            {loading ? "Running..." : "Run Analysis"}
          </button>

          <button
            onClick={() => {
              setShock(true);
              runAnalysis("shock");
              setTimeout(() => setShock(false), 1500);
            }}
            className="w-full px-3 py-2 text-xs rounded border border-slate-700 hover:border-red-500 text-red-400"
          >
            {shock ? "⚡ SHOCK ACTIVE" : "Market Shock"}
          </button>

          <button
            onClick={() => setAutonomy(!autonomy)}
            className={`w-full px-3 py-2 text-xs rounded ${
              autonomy
                ? "bg-green-600 hover:bg-green-500"
                : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            {autonomy ? "🤖 AUTONOMY ON" : "Enable Autonomy"}
          </button>

        </aside>

        {/* CENTER */}
        <main className="flex-1 p-6 space-y-6">

          <div className="grid grid-cols-2 gap-4">

            {/* PORTFOLIO */}
            <div className="bg-[#0B1020] border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">
                Portfolio Exposure
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>NVDA</span><span className="text-green-400">35%</span>
                </div>
                <div className="flex justify-between">
                  <span>MSFT</span><span className="text-green-400">25%</span>
                </div>
                <div className="flex justify-between">
                  <span>AAPL</span><span className="text-green-400">20%</span>
                </div>
                <div className="flex justify-between">
                  <span>CASH</span><span className="text-blue-400">20%</span>
                </div>
              </div>
            </div>

            {/* AI ENGINE */}
            <div className="bg-[#0B1020] border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">
                AI Decision Engine
              </h2>

              {ai ? (
                <div className="space-y-2 text-xs">
                  <p className="text-blue-400">Analyst: {ai.thesis}</p>
                  <p className="text-yellow-400">Risk: {ai.risk}</p>

                  <div className="text-green-400">
                    {ai.trades?.map((t: string, i: number) => (
                      <p key={i}>• {t}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">
                  Run analysis to activate AI engine
                </p>
              )}
            </div>

          </div>

          {/* EXECUTION LOG */}
          <div className="bg-[#0B1020] border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">
              Execution Log
            </h3>

            <div className="text-xs space-y-2 text-slate-300">
              {log.length === 0 ? (
                <p>[SYSTEM] Awaiting analysis...</p>
              ) : (
                log.map((l, i) => <p key={i}>{l}</p>)
              )}
            </div>
          </div>

        </main>

        {/* RIGHT PANEL */}
        <aside className="w-72 border-l border-slate-800 p-4 bg-[#050814] space-y-4">

          <div>
            <h3 className="text-sm font-semibold mb-2">
              System Status
            </h3>
            <p className="text-xs text-slate-400">Latency: 38ms</p>
            <p className="text-xs text-slate-400">Market Sync: Active</p>
            <p className="text-xs text-green-400">
              All Systems Operational
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">
              AI Insight
            </h3>
            <p className="text-xs text-blue-400">
              Portfolio optimized for momentum strategy.
            </p>
          </div>

        </aside>

      </div>

      {/* FOOTER */}
      <div className="px-6 py-2 border-t border-slate-800 text-xs text-slate-500">
        Sentient Portfolio OS • Autonomous AI Simulation • ETHGlobal Build
      </div>

    </div>
  );
}