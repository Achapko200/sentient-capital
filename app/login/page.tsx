"use client";

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { supabase }            from "@/lib/supabase";
import { DynamicWidget }       from "@dynamic-labs/sdk-react-core";
import { useAuth }             from "@/lib/auth-context";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router                         = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mode,     setMode]            = useState<Mode>("login");
  const [email,    setEmail]           = useState("");
  const [password, setPassword]        = useState("");
  const [name,     setName]            = useState("");
  const [loading,  setLoading]         = useState(false);
  const [error,    setError]           = useState("");
  const [success,  setSuccess]         = useState("");

  // Redirect if already authenticated via wallet
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  // Also check Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  const handleEmailAuth = async () => {
    if (!email || !password) { setError("Fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      </div>

      {/* Nav */}
      <div className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <a href="/landing" className="flex items-center gap-3 hover:opacity-80 transition">
          <span className="text-2xl">⚾</span>
          <span className="text-lg font-black">Card Tracker</span>
        </a>
        <a href="/landing" className="text-gray-400 hover:text-white text-sm transition">
          ← Back
        </a>
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">

          {/* Card */}
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl">

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                ⚾
              </div>
              <h1 className="text-2xl font-black mb-1">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-gray-400 text-sm">
                {mode === "login"
                  ? "Sign in to your Card Tracker account"
                  : "Start trading baseball card shares"}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-1 bg-gray-800 rounded-xl p-1 mb-6">
              {(["login", "signup"] as Mode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  className={`py-2 rounded-lg text-sm font-bold capitalize transition ${
                    mode === m ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"
                  }`}>
                  {m === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Wallet connect — primary */}
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                Connect with wallet
              </p>
              <div className="flex justify-center">
                <DynamicWidget />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs">or use email</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Email form */}
            <div className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Anna Chapko"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
                  />
                </div>
              )}

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
                />
              </div>

              {error   && <p className="text-red-400 text-xs">{error}</p>}
              {success && <p className="text-green-400 text-xs">{success}</p>}

              <button
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full py-3 rounded-xl font-black text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
              >
                {loading
                  ? "..."
                  : mode === "login" ? "Log In" : "Create Account"}
              </button>

              {mode === "login" && (
                <button
                  onClick={async () => {
                    if (!email) { setError("Enter your email first"); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) setError(error.message);
                    else setSuccess("Password reset email sent");
                  }}
                  className="w-full text-gray-500 text-xs hover:text-gray-400 transition text-center"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
              What you get
            </p>
            <div className="space-y-2">
              {[
                { icon: "📊", text: "Trade card shares with limit orders" },
                { icon: "⚾", text: "Live MLB buy/sell/hold signals"       },
                { icon: "⚡", text: "Instant USDC settlement on Base"      },
                { icon: "🏦", text: "Redeem shares for physical PSA cards" },
                { icon: "🔔", text: "Price alerts via email"               },
                { icon: "🤖", text: "AI trading assistant"                 },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{f.icon}</span>
                  <span className="text-gray-400 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center">
            By signing up you agree to our{" "}
            <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
            {" "}and{" "}
            <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}