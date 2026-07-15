// app/page.tsx
"use client";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "📊", title: "Trade Card Shares",      desc: "Buy and sell fractional shares of PSA-graded cards with limit orders — just like stocks." },
  { icon: "⚾", title: "Live MLB Signals",       desc: "AI-powered BUY/HOLD/SELL signals based on real MLB stats updated daily." },
  { icon: "💰", title: "Real eBay Prices",       desc: "Live eBay market data shows you what cards are actually worth right now." },
  { icon: "🤖", title: "AI Trading Assistant",  desc: "Ask our AI anything about card values, trading strategy, and market trends." },
  { icon: "🔔", title: "Price Alerts",           desc: "Set target prices and get notified the moment your card hits your target." },
  { icon: "📸", title: "Card Scanner",           desc: "Scan any physical card with your camera for instant AI grading and valuation." },
];

const STATS = [
  { value: "PSA 10", label: "Only graded cards"   },
  { value: "Live",   label: "MLB data feed"        },
  { value: "USDC",   label: "On-chain settlement"  },
  { value: "Free",   label: "To get started"       },
];

export default function Landing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚾</span>
          <span className="text-xl font-black">Card Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/pricing" className="text-gray-400 hover:text-white text-sm transition hidden md:block">Pricing</a>
          <button onClick={() => router.push("/login")}
            className="text-sm font-bold px-4 py-2 rounded-xl border border-gray-700 hover:border-gray-500 transition hidden md:block">
            Sign in
          </button>
          <button onClick={() => router.push("/login")}
            className="text-sm font-bold px-5 py-2.5 rounded-xl transition"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            Get started free
          </button>
        </div>
      </nav>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-20 md:pt-32 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-4 py-1.5 text-xs text-gray-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live MLB data · Real eBay prices · AI signals
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Trade baseball cards<br />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #2563eb, #7c3aed, #db2777)" }}>
            like stocks
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Buy and sell fractional shares of PSA-graded MLB rookie cards.
          Powered by real MLB stats, live eBay prices, and AI trading signals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-2xl font-black text-lg transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            Start trading free →
          </button>
          <a href="/pricing"
            className="px-8 py-4 rounded-2xl font-bold text-lg border border-gray-700 hover:border-gray-500 transition text-gray-300 hover:text-white text-center">
            View pricing
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {STATS.map(s => (
            <div key={s.value} className="bg-gray-900/60 border border-gray-800 rounded-2xl px-4 py-4">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pb-20">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gray-950 px-6 py-4 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚾</span>
              <span className="font-black text-white">Card Tracker</span>
            </div>
            <div className="flex gap-1">
              {["Cards", "Trade", "Portfolio", "AI", "Alerts"].map(t => (
                <span key={t} className={"px-3 py-1 rounded-full text-xs font-semibold " + (t === "Cards" ? "bg-white text-gray-900" : "text-gray-500")}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Kyle Schwarber",   team: "Philadelphia Phillies", signal: "BUY",  pct: "+7.1%",  price: "$687", color: "border-green-500/40 bg-green-950/20"  },
              { name: "Paul Skenes",      team: "Pittsburgh Pirates",    signal: "BUY",  pct: "+12.3%", price: "$420", color: "border-green-500/40 bg-green-950/20"  },
              { name: "Yordan Alvarez",   team: "Houston Astros",        signal: "HOLD", pct: "+2.1%",  price: "$164", color: "border-yellow-500/40 bg-yellow-950/20" },
              { name: "Gunnar Henderson", team: "Baltimore Orioles",     signal: "SELL", pct: "-3.2%",  price: "$312", color: "border-red-500/40 bg-red-950/20"       },
            ].map(card => (
              <div key={card.name} className={"border " + card.color + " rounded-2xl p-4 flex items-center justify-between"}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl">⚾</div>
                  <div>
                    <p className="font-bold text-white text-sm">{card.name}</p>
                    <p className="text-gray-500 text-xs">{card.team}</p>
                    <span className={"text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-block " + (
                      card.signal === "BUY"  ? "bg-green-900 text-green-400" :
                      card.signal === "HOLD" ? "bg-yellow-900 text-yellow-400" :
                                               "bg-red-900 text-red-400"
                    )}>{card.signal}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-black">{card.price}</p>
                  <p className={"text-sm font-bold " + (card.pct.startsWith("+") ? "text-green-400" : "text-red-400")}>{card.pct}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20 border-t border-gray-800">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Everything you need to trade cards</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">Professional trading tools for baseball card collectors and investors.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-black text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20 border-t border-gray-800">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Sign up free",        desc: "Create an account in seconds with Google or email" },
            { step: "2", title: "Browse player cards",  desc: "View AI signals, eBay prices, and MLB performance data" },
            { step: "3", title: "Place limit orders",   desc: "Buy card shares at your price — orders fill automatically" },
            { step: "4", title: "Trade and profit",     desc: "Sell when the price is right or redeem the physical card" },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4">{s.step}</div>
              <h3 className="font-black text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20 border-t border-gray-800">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">Start free, upgrade when you need more.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { name: "Free",  price: "$0",     color: "border-gray-700",   features: ["3 price alerts", "5 AI messages/day", "All card signals"] },
            { name: "Pro",   price: "$9.99",  color: "border-blue-500",   features: ["Unlimited alerts", "Unlimited AI", "Card scanner"], badge: "Popular" },
            { name: "Elite", price: "$24.99", color: "border-purple-500", features: ["Real-time eBay", "Priority AI", "Advanced analytics"] },
          ].map(p => (
            <div key={p.name} className={"bg-gray-900 border-2 " + p.color + " rounded-2xl p-6 relative"}>
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>
              )}
              <h3 className="font-black text-xl mb-1">{p.name}</h3>
              <p className="text-2xl font-black mb-4">{p.price}<span className="text-gray-500 text-sm font-normal">{p.price !== "$0" ? "/mo" : ""}</span></p>
              <ul className="space-y-2">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition">See full pricing →</a>
        </div>
      </section>

      <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-24 text-center border-t border-gray-800">
        <h2 className="text-4xl md:text-5xl font-black mb-4">Start trading today</h2>
        <p className="text-gray-400 mb-8 text-lg">Free to sign up. No credit card required.</p>
        <button onClick={() => router.push("/login")}
          className="px-10 py-4 rounded-2xl font-black text-lg transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
          Get started free →
        </button>
      </section>

      <footer className="relative z-10 border-t border-gray-800 px-6 md:px-12 py-8 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
        <div className="flex items-center gap-2">
          <span>⚾</span>
          <span className="font-bold text-gray-400">Card Tracker</span>
          <span>· Trade baseball cards like stocks</span>
        </div>
        <div className="flex gap-6">
          <a href="/pricing" className="hover:text-gray-300 transition">Pricing</a>
          <a href="/login"   className="hover:text-gray-300 transition">Sign in</a>
          <span>Base · USDC · MLB API · PSA</span>
        </div>
      </footer>
    </div>
  );
}
