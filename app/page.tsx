// app/landing/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚾</span>
          <span className="text-lg font-black">Card Tracker</span>
        </div>
        <button onClick={() => router.push("/login")}
          className="px-5 py-2 rounded-xl font-bold text-sm transition"
          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
          Launch App →
        </button>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs font-semibold mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Built for ETHGlobal NYC 2026 · Base · Dynamic · ENS · Circle
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-6">
          Baseball cards.
          <br />
          <span style={{
            background: "linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #d97706)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Traded like stocks.
          </span>
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Buy and sell shares of PSA-graded baseball cards with a real order book,
          live MLB performance signals, and instant USDC settlement on Base.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
          <button onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-2xl font-black text-lg transition hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            Start Trading →
          </button>
          <button onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-2xl font-black text-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition">
            View Order Book
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "📊", title: "Order Book Trading",      desc: "Place limit BUY and SELL orders just like a stock exchange. Price discovery happens naturally." },
            { icon: "⚾", title: "Live MLB Signals",        desc: "AI signals update daily from real stats — HR, OPS, batting average. Know when to act." },
            { icon: "💎", title: "PSA Vault Redemption",    desc: "Every card is PSA-graded and held in a vault. Redeem shares for the physical card anytime." },
            { icon: "⚡", title: "USDC on Base",            desc: "All trades settle instantly in USDC on Base. Sub-cent gas fees, 2-second confirmations." },
          ].map(f => (
            <div key={f.title} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-white font-black text-base mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-black text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", icon: "🔍", title: "Find a card",    desc: "Browse PSA 10 cards for top MLB HR leaders. Each card is divided into 100 tradeable shares priced by real performance." },
            { step: "02", icon: "📋", title: "Place an order", desc: "Set your limit price and number of shares. Your order sits in the live order book until a seller matches." },
            { step: "03", icon: "🏦", title: "Trade or redeem", desc: "Sell shares anytime to the next buyer at market price. Or own 100 shares and redeem for the physical PSA card." },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="text-7xl font-black text-gray-800 mb-2">{s.step}</div>
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-white font-black text-lg mb-3">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 max-w-3xl mx-auto px-8 py-24 text-center border-t border-gray-800">
        <h2 className="text-4xl font-black mb-4">Ready to trade?</h2>
        <p className="text-gray-400 mb-8">Connect your wallet and place your first order in under a minute.</p>
        <button onClick={() => router.push("/login")}
          className="px-10 py-4 rounded-2xl font-black text-lg transition hover:scale-105"
          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
          Launch App →
        </button>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 px-8 py-6 max-w-7xl mx-auto flex justify-between items-center text-gray-500 text-xs">
        <span>⚾ Card Tracker · Built for ETHGlobal NYC 2026</span>
        <span>Base · USDC · MLB Stats API · PSA</span>
      </footer>
    </div>
  );
}