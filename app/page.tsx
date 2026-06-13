import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import ExecutionLog from "@/components/ExecutionLog";
import StockPanel from "@/components/StockPanel";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Top Bar */}
        <TopBar />

        {/* Page Body */}
        <main className="p-8 space-y-6">

          <h1 className="text-3xl font-bold">
            Sentient Capital AI Fund
          </h1>

          {/* LIVE STOCK PANEL */}
          <div className="grid grid-cols-2 gap-4">
            <StockPanel symbol="TSLA" />
            <StockPanel symbol="NVDA" />
          </div>

          {/* EXECUTION ENGINE */}
          <ExecutionLog />

        </main>
      </div>
    </div>
  );
}