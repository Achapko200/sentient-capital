// ─── app/portfolio/page.tsx ───────────────────────────────────────────────────

import EquityCurve   from "@/components/EquityCurve";
import PortfolioCard from "@/components/PortfolioCard";
import ExecutionLog  from "@/components/ExecutionLog";
import Markets       from "@/components/Markets";

export default function PortfolioPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-1">Portfolio</h1>
        <p className="text-slate-400">Live allocations, performance, and risk metrics.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <EquityCurve />
        </div>
        <PortfolioCard />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ExecutionLog />
        <Markets />
      </div>
    </div>
  );
}
