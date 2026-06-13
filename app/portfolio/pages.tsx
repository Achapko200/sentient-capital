export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Portfolio</h1>

      <p className="text-slate-400 mb-8">
        Live portfolio allocations and performance.
      </p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-96 rounded-2xl border border-slate-800 bg-[#0B1020]" />

        <div className="h-96 rounded-2xl border border-slate-800 bg-[#0B1020]" />
      </div>

      <div className="mt-6 h-72 rounded-2xl border border-slate-800 bg-[#0B1020]" />
    </div>
  );
}