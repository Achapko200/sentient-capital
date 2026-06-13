export default function TopBar() {
  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-[#050814]">
      <div>
        <h1 className="font-semibold tracking-wide">
          🧠 AURA Fund OS
        </h1>

        <p className="text-xs text-slate-500">
          Autonomous Investment Committee
        </p>
      </div>

      <div className="flex gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
          ● LIVE MARKET SYNC
        </span>

        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          AGENTS ONLINE
        </span>
      </div>
    </div>
  );
}