export default function AttestationPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Confidential AI Attestation
        </h1>

        <p className="text-slate-400">
          Chainlink-powered confidential risk verification.
        </p>
      </div>

      <div className="max-w-5xl rounded-2xl border border-slate-800 bg-[#0B1020] p-8 space-y-4">
        <div className="h-20 rounded-xl bg-slate-900" />
        <div className="h-20 rounded-xl bg-slate-900" />
        <div className="h-20 rounded-xl bg-slate-900" />
      </div>
    </div>
  );
}