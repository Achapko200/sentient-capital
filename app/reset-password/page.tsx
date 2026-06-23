"use client";

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { supabase }            from "@/lib/supabase";

export default function ResetPassword() {
  const router                     = useRouter();
  const [password,  setPassword]   = useState("");
  const [confirm,   setConfirm]    = useState("");
  const [loading,   setLoading]    = useState(false);
  const [error,     setError]      = useState("");
  const [success,   setSuccess]    = useState("");

  const handleReset = async () => {
    if (password !== confirm)   { setError("Passwords don't match"); return; }
    if (password.length < 8)    { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password updated! Redirecting...");
      setTimeout(() => router.push("/"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">🔐</span>
          <h1 className="text-2xl font-black mb-1">Reset Password</h1>
          <p className="text-gray-400 text-sm">Enter your new password</p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleReset()}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          />

          {error   && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <button onClick={handleReset} disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}