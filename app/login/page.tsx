"use client";

import { useEffect }              from "react";
import { useRouter }              from "next/navigation";
import { DynamicWidget }          from "@dynamic-labs/sdk-react-core";
import { useAuth }                from "@/lib/auth-context";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to app once authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚾</span>
          <span className="text-lg font-black">Card Tracker</span>
        </div>
        <a href="/landing" className="text-gray-400 hover:text-white text-sm transition">
          Learn more →
        </a>
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl">

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                ⚾
              </div>
              <h1 className="text-2xl font-black mb-2">Welcome to Card Tracker</h1>
              <p className="text-gray-400 text-sm">
                Connect your wallet to start trading baseball card shares
              </p>
            </div>

            {/* Dynamic widget */}
            <div className="flex justify-center mb-6">
              {isLoading ? (
                <div className="h-12 w-48 bg-gray-800 rounded-xl animate-pulse" />
              ) : (
                <DynamicWidget />
              )}
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {[
                { icon: "📊", text: "Trade card shares with limit orders" },
                { icon: "⚾", text: "Live MLB signals — BUY / HOLD / SELL" },
                { icon: "⚡", text: "Instant USDC settlement on Base" },
                { icon: "🏦", text: "Redeem shares for physical cards" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{f.icon}</span>
                  <span className="text-gray-400 text-sm">{f.text}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-600 text-xs text-center">
              No email required · No password · Just your wallet
            </p>
          </div>

          {/* Footer */}
          <p className="text-gray-600 text-xs text-center mt-6">
            By connecting you agree to our{" "}
            <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
            {" "}and{" "}
            <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}