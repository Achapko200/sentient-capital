// ─── app/page.tsx ─────────────────────────────────────────────────────────────

import TopBar       from "@/components/TopBar";
import Sidebar      from "@/components/Sidebar";
import Footer       from "@/components/Footer";
import StockPanel   from "@/components/StockPanel";
import ExecutionLog from "@/components/ExecutionLog";
import EquityCurve  from "@/components/EquityCurve";
import PortfolioCard from "@/components/PortfolioCard";
import AgentPanel   from "@/components/AgentPanel";
import MarketStream from "@/components/MarketStream";
import InsightsPanel from "@/components/InsightsPanel";
import Markets      from "@/components/Markets";

export default function Home() {
  return (
    <div className="flex h-screen bg-[#030712] text-white overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section: Live Prices */}
          <section>
            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Live Prices</h2>
            <div className="grid grid-cols-2 gap-4">
              <StockPanel symbol="TSLA" />
              <StockPanel symbol="NVDA" />
            </div>
          </section>

          {/* Section: Agents */}
          <section>
            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3">AI Committee</h2>
            <AgentPanel />
          </section>

          {/* Section: Equity + Portfolio */}
          <section>
            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Fund Performance</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <EquityCurve />
              </div>
              <PortfolioCard />
            </div>
          </section>

          {/* Section: Execution + Market Stream */}
          <section>
            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Trade Execution</h2>
            <div className="grid grid-cols-2 gap-4">
              <ExecutionLog />
              <MarketStream />
            </div>
          </section>

          {/* Section: Markets + Insights */}
          <section>
            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Intelligence</h2>
            <div className="grid grid-cols-2 gap-4">
              <Markets />
              <InsightsPanel />
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
}
