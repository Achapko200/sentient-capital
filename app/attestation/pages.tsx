// ─── app/attestation/page.tsx ─────────────────────────────────────────────────

export default function AttestationPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-1">Confidential AI Attestation</h1>
        <p className="text-slate-400">Chainlink-powered confidential risk verification.</p>
      </div>

      <div className="max-w-3xl rounded-2xl border border-slate-800 bg-[#0B1020] p-8 space-y-4">
        {[
          { label: "Agent Integrity Hash", value: "0x4f3a…d92e", status: "VERIFIED" },
          { label: "Risk Model Attestation", value: "v2.1.0-stable", status: "VERIFIED" },
          { label: "Execution Audit Trail", value: "On-chain via Chainlink CCIP", status: "ACTIVE" },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-center p-4 rounded-xl bg-slate-900">
            <div>
              <p className="text-white font-medium text-sm">{item.label}</p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">{item.value}</p>
            </div>
            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
