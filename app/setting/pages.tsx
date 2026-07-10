"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = "general" | "notifications" | "personalization" | "security";

export default function SettingsPage() {
  const router  = useRouter();
  const [section, setSection] = useState<Section>("general");
  const [appearance, setAppearance] = useState("System");
  const [language,   setLanguage]   = useState("Auto-detect");

  const NAV = [
    { id: "general",         label: "General",         icon: "⚙️" },
    { id: "notifications",   label: "Notifications",   icon: "🔔" },
    { id: "personalization", label: "Personalization", icon: "🎨" },
    { id: "security",        label: "Security & login", icon: "🔒" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 h-[80vh] flex overflow-hidden">

        {/* Left sidebar */}
        <div className="w-48 border-r border-gray-100 flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="py-2 flex-1">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${
                  section === item.id
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">

          {/* General */}
          {section === "general" && (
            <div className="px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">General</h2>

              {/* MFA banner */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 relative">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">Secure your account</p>
                    <p className="text-gray-500 text-xs mt-1">Add multi-factor authentication to protect your account when logging in.</p>
                    <button className="mt-3 px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition">
                      Set up MFA
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings rows */}
              {[
                { label: "Appearance", value: appearance, options: ["System", "Dark", "Light"], set: setAppearance },
                { label: "Language",   value: language,   options: ["Auto-detect", "English (US)"], set: setLanguage },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{row.label}</span>
                  <select
                    value={row.value}
                    onChange={e => row.set(e.target.value)}
                    className="text-sm text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    {row.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Notifications</h2>
              {[
                { label: "Price alerts",    desc: "Get notified when your target price is hit",        value: "Email" },
                { label: "Trade fills",     desc: "Get notified when your limit order fills",          value: "Push"  },
                { label: "Market updates",  desc: "Weekly MLB performance and card market summary",    value: "Email" },
                { label: "New listings",    desc: "Get notified when new cards are listed",            value: "Push"  },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                    <option>Push</option>
                    <option>Email</option>
                    <option>Push, Email</option>
                    <option>Off</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Personalization */}
          {section === "personalization" && (
            <div className="px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Personalization</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Favorite team</p>
                    <p className="text-xs text-gray-400 mt-0.5">Highlight cards from your favorite MLB team</p>
                  </div>
                  <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                    <option>None</option>
                    <option>New York Yankees</option>
                    <option>Los Angeles Dodgers</option>
                    <option>Boston Red Sox</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Default tab</p>
                    <p className="text-xs text-gray-400 mt-0.5">Which tab to show when you open the app</p>
                  </div>
                  <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                    <option>Card Tracker</option>
                    <option>Trade</option>
                    <option>Portfolio</option>
                    <option>Analyst Picks</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Show AI signals</p>
                    <p className="text-xs text-gray-400 mt-0.5">Show BUY/HOLD/SELL signals on player cards</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div className="px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Security & login</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Email</p>
                    <p className="text-xs text-gray-400 mt-0.5">Your login email address</p>
                  </div>
                  <span className="text-sm text-gray-500">Connected</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Google</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sign in with Google</p>
                  </div>
                  <span className="text-sm text-gray-500">Connected</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Crypto wallet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Connect a wallet for on-chain trading</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Connect</button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Multi-factor authentication</p>
                    <p className="text-xs text-gray-400 mt-0.5">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Set up
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}