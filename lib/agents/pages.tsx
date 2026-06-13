export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">
      <h1 className="text-4xl font-bold mb-2">AI Agents</h1>
      <p className="text-slate-400 mb-8">
        Autonomous investment committee members.
      </p>

      <div className="grid grid-cols-3 gap-6">
        <div className="h-72 rounded-2xl border border-slate-800 bg-[#0B1020]" />
        <div className="h-72 rounded-2xl border border-slate-800 bg-[#0B1020]" />
        <div className="h-72 rounded-2xl border border-slate-800 bg-[#0B1020]" />
      </div>
    </div>
  );
}