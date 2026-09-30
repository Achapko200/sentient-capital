"use client";
// Requires a verified authenticator code (Supabase MFA, "aal2") before any admin content loads.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stage = "loading" | "enroll" | "challenge" | "ok";

export default function AdminMfaGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [stage, setStage]   = useState<Stage>("loading");
  const [factorId, setFid]  = useState("");
  const [qr, setQr]         = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode]     = useState("");
  const [error, setError]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  async function requestReset() {
    setResetMsg("Sending…");
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
    const r = await fetch("/api/admin/mfa-reset", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setResetMsg(r.ok ? "Check your email for a reset link (valid 15 minutes)." : "Couldn't send the reset email. Try again shortly.");
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") { setStage("ok"); return; }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find(f => f.status === "verified");
      if (totp) { setFid(totp.id); setStage("challenge"); return; }
      // Clean up unfinished enrollments, then start a new one
      for (const f of factors?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Card Tracker admin ${Date.now()}` });
      if (error || !data) { setError(error?.message ?? "Could not start setup"); setStage("enroll"); return; }
      setFid(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); setStage("enroll");
    })();
  }, [router]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (error) { setError("That code didn't work. Check the time on your phone and try the newest code."); setCode(""); return; }
    setStage("ok");
  }

  if (stage === "ok") return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <form onSubmit={verify} className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900/70 p-7">
        <h1 className="text-xl font-bold">Admin verification</h1>
        {stage === "loading" && <p className="text-sm text-gray-400 mt-2">Checking your account…</p>}
        {stage === "enroll" && (
          <>
            <p className="text-sm text-gray-400 mt-2">Scan this with your authenticator app, then enter the 6-digit code. You'll only do this once.</p>
            {qr && <img src={qr} alt="Authenticator QR code" className="mt-5 mx-auto w-44 h-44 rounded-lg bg-white p-2" />}
            {secret && <p className="mt-3 text-center text-xs text-gray-500 font-mono break-all">{secret.match(/.{1,4}/g)?.join(" ")}</p>}
          </>
        )}
        {stage === "challenge" && <p className="text-sm text-gray-400 mt-2">Enter the 6-digit code from your authenticator app.</p>}
        {stage !== "loading" && (
          <>
            <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={7} autoFocus
              placeholder="123 456" className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono outline-none focus:border-blue-500" />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <button disabled={busy || code.replace(/\s/g, "").length !== 6}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold hover:bg-blue-500 disabled:opacity-50">
              {busy ? "Verifying…" : "Verify"}
            </button>
            {stage === "challenge" && (
              <div className="mt-4 text-center">
                <button type="button" onClick={requestReset} className="text-xs text-gray-400 hover:text-white underline">
                  Lost access to your authenticator app?
                </button>
                {resetMsg && <p className="mt-2 text-xs text-gray-400">{resetMsg}</p>}
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}
