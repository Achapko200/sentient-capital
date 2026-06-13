"use client";

export default function Sidebar() {
  const runAnalysis = async () => {
    await fetch("/api/analyze");
  };

  const marketShock = async () => {
    await fetch("/api/analyze/risk");
  };

  const enableAutonomy = async () => {
    await fetch("/api/analyze/loop/start");
  };

  return (
    <aside className="w-64 border-r border-slate-800 p-4 space-y-6 bg-[#050814] text-white">
      
      {/* FUND STATUS */}
      <div>
        <p className="text-xs text-slate-500">FUND MODE</p>

        <p className="font-medium">
          Autonomous Portfolio
        </p>

        <p className="text-green-400 text-xs">
          ACTIVE
        </p>
      </div>

      {/* AGENTS */}
      <div>
        <p className="text-xs text-slate-500 mb-2">
          AI AGENTS
        </p>

        <div className="space-y-2 text-sm text-slate-200">
          <p>research.aura.eth</p>
          <p>risk.aura.eth</p>
          <p>trader.aura.eth</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="space-y-2 pt-4">
        <button
          onClick={runAnalysis}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500"
        >
          Run Analysis
        </button>

        <button
          onClick={marketShock}
          className="w-full py-2 rounded border border-slate-700 hover:border-red-500"
        >
          Market Shock
        </button>

        <button
          onClick={enableAutonomy}
          className="w-full py-2 rounded bg-purple-600 hover:bg-purple-500"
        >
          Enable Autonomy
        </button>
      </div>

    </aside>
  );
}