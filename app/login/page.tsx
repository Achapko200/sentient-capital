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

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  const handleEmailAuth = async () => {
    if (!email || !password) { setError("Fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { name } },
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

  const handleOAuth = async (provider: "google") => {
    setError("");
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/`
      : `${window.location.origin}/`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) setError(error.message);
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

            {/* Google login */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Wallet connect */}
              <div className="flex flex-col items-center pt-1">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                  or connect crypto wallet
                </p>
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
            <div className="space-y-3" suppressHydrationWarning>
              {mode === "signup" && (
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                    Full Name
                  </label>
                  <input
                    suppressHydrationWarning
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
                  suppressHydrationWarning
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
                  suppressHydrationWarning
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
                suppressHydrationWarning
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full py-3 rounded-xl font-black text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
              >
                {loading ? "..." : mode === "login" ? "Log In" : "Create Account"}
              </button>

              {mode === "login" && (
                <button
                  suppressHydrationWarning
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