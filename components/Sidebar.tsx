export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 p-4 bg-[#050814]">
      <div className="space-y-6">

        <div>
          <p className="text-xs text-slate-500">
            FUND MODE
          </p>

          <p className="font-medium">
            Autonomous Portfolio
          </p>

          <p className="text-green-400 text-xs">
            ACTIVE
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">
            AI AGENTS
          </p>

          <div className="space-y-2 text-sm">
            <p>research.aura.eth</p>
            <p>risk.aura.eth</p>
            <p>trader.aura.eth</p>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <button className="w-full py-2 rounded bg-blue-600">
            Run Analysis
          </button>

          <button className="w-full py-2 rounded border border-slate-700">
            Market Shock
          </button>

          <button className="w-full py-2 rounded bg-purple-600">
            Enable Autonomy
          </button>
        </div>

      </div>
    </aside>
  );
}