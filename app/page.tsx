"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#04060A] text-white flex flex-col">

      {/* TOP SYSTEM BAR */}
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

        {/* LEFT NAV */}
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

          <div className="pt-4 space-y-2">
            <button className="w-full px-3 py-2 text-xs rounded bg-blue-600 hover:bg-blue-500">
              Run Analysis
            </button>

            <button className="w-full px-3 py-2 text-xs rounded border border-slate-700 hover:border-slate-500">
              Market Shock
            </button>

            <button className="w-full px-3 py-2 text-xs rounded bg-purple-600 hover:bg-purple-500">
              Enable Autonomy
            </button>
          </div>
        </aside>

        {/* CENTER WORKSPACE */}
        <main className="flex-1 p-6 space-y-6">

          {/* GRID CARDS */}
          <div className="grid grid-cols-2 gap-4">

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

            <div className="bg-[#0B1020] border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">
                AI Decision Engine
              </h2>

              <div className="space-y-2 text-xs">
                <p className="text-blue-400">
                  Analyst: Macro tech trend remains bullish
                </p>
                <p className="text-yellow-400">
                  Risk: NVDA concentration above threshold
                </p>
                <p className="text-green-400">
                  Decision: Rotate 10% NVDA → MSFT
                </p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-3 gap-4">

            <div className="col-span-1 bg-[#0B1020] border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">
                Market Stream
              </h3>

              <div className="text-xs space-y-2 text-slate-300">
                <p>NVDA beats earnings expectations</p>
                <p>Fed signals potential rate cuts</p>
                <p>AI sector volatility increasing</p>
                <p>Institutional inflows rising</p>
              </div>
            </div>

            <div className="col-span-2 bg-[#0B1020] border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">
                Execution Log
              </h3>

              <div className="text-xs space-y-2 text-slate-300">
                <p>[SYSTEM] Portfolio initialized</p>
                <p>[AI] Running risk model...</p>
                <p>[AI] No trades executed yet</p>
                <p className="text-green-400">
                  [READY] Awaiting market event
                </p>
              </div>
            </div>

          </div>

        </main>

        {/* RIGHT INSIGHTS */}
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
              Risk Summary
            </h3>
            <p className="text-xs text-yellow-400">
              Moderate risk exposure detected in tech sector concentration.
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
        Sentient Portfolio OS • Autonomous Capital Simulation • v0.1 • ETHGlobal Build
      </div>

    </div>
  );
}