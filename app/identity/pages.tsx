import PortfolioCard from "@/components/PortfolioCard";
import ExecutionLog from "@/components/ExecutionLog";

export default function IdentityPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">

      {/* HEADER */}
      <h1 className="text-4xl font-bold mb-2">
        ENS Agent Identity
      </h1>

      <p className="text-slate-400 mb-8">
        Onchain reputation, execution performance, and capital allocation layer.
      </p>

      {/* MAIN 3-COLUMN TRADING OS LAYOUT */}
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT PANEL — EXECUTION STREAM */}
        <div className="space-y-6">
          <ExecutionLog />
        </div>

        {/* CENTER PANEL — PORTFOLIO BRAIN */}
        <div className="space-y-6">
          <PortfolioCard />
        </div>

        {/* RIGHT PANEL — AGENT IDENTITY LAYER */}
        <div className="space-y-6">

          {/* Identity Card 1 */}
          <div className="h-80 rounded-2xl border border-slate-800 bg-[#0B1020] p-4">
            <h2 className="text-lg font-semibold mb-2">
              Macro Agent Identity
            </h2>
            <p className="text-sm text-slate-400">
              Performance attribution, decision history, and behavioral bias tracking.
            </p>
          </div>

          {/* Identity Card 2 */}
          <div className="h-80 rounded-2xl border border-slate-800 bg-[#0B1020] p-4">
            <h2 className="text-lg font-semibold mb-2">
              Quant Agent Identity
            </h2>
            <p className="text-sm text-slate-400">
              Signal accuracy, Sharpe contribution, and model confidence evolution.
            </p>
          </div>

          {/* Identity Card 3 */}
          <div className="h-80 rounded-2xl border border-slate-800 bg-[#0B1020] p-4">
            <h2 className="text-lg font-semibold mb-2">
              Risk Agent Identity
            </h2>
            <p className="text-sm text-slate-400">
              Drawdown control effectiveness and capital preservation score.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}