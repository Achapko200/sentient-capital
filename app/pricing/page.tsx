"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase }  from "@/lib/supabase";

const PLANS = [
  {
    id:          "free",
    name:        "Free",
    price:       0,
    description: "Get started with card tracking",
    color:       "border-gray-200",
    badge:       null,
    features: [
      "View all player cards & signals",
      "3 price alerts",
      "5 AI messages per day",
      "Basic portfolio tracking",
      "Order book trading",
    ],
    limits: [
      "No card scanner",
      "No data export",
      "No real-time eBay prices",
    ],
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       9.99,
    description: "For serious card traders",
    color:       "border-blue-500",
    badge:       "Most Popular",
    features: [
      "Everything in Free",
      "Unlimited price alerts",
      "Unlimited AI messages",
      "Card scanner (AI grading)",
      "Export portfolio data",
      "Advanced signals",
      "Priority support",
    ],
    limits: [],
  },
  {
    id:          "elite",
    name:        "Elite",
    price:       24.99,
    description: "For professional collectors",
    color:       "border-purple-500",
    badge:       "Best Value",
    features: [
      "Everything in Pro",
      "Real-time eBay price tracking",
      "Priority AI responses",
      "Advanced analytics dashboard",
      "Early access to new signals",
      "Custom watchlists",
      "Dedicated support",
    ],
    limits: [],
  },
];

export default function PricingPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") { router.push("/app"); return; }
    setLoading(planId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // For now — direct upgrade (Stripe integration coming soon)
      const res = await fetch("/api/subscription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id, tier: planId }),
      });

      if (res.ok) {
        router.push("/app?upgraded=true");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center gap-3">
        <a href="/app" className="text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <span className="text-2xl">⚾</span>
        <h1 className="font-black text-lg">Card Tracker</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">Choose your plan</h2>
          <p className="text-gray-400 text-lg">Trade smarter with real MLB data and AI signals</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`bg-gray-900 rounded-2xl border-2 ${plan.color} p-6 relative flex flex-col`}>
              
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                  plan.id === "pro" ? "bg-blue-600" : "bg-purple-600"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/month</span>}
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
                {plan.limits.map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-gray-500">{l}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 ${
                  plan.id === "free"
                    ? "border border-gray-600 text-gray-300 hover:bg-gray-800"
                    : plan.id === "pro"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {loading === plan.id ? "Processing..." :
                 plan.id === "free" ? "Get started free" :
                 `Subscribe to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Stripe payment processing coming soon. Subscriptions are currently free during beta.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Cancel anytime · No hidden fees · Apple takes 30% on iOS
          </p>
        </div>
      </div>
    </div>
  );
}
