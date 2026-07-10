"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = "general" | "notifications" | "personalization" | "security" | "account";

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("general");
  const [appearance, setAppearance] = useState("System");
  const [language,   setLanguage]   = useState("Auto-detect");
  const [mfaApp,     setMfaApp]     = useState(false);
  const [mfaSms,     setMfaSms]     = useState(false);
  const [aiSignals,  setAiSignals]  = useState(true);
  const [notifications, setNotifications] = useState({
    priceAlerts: "Email",
    tradeFills:  "Push",
    marketUpdates: "Email",
    newListings:   "Off",
  });

  const NAV: { id: Section; label: string }[] = [
    { id: "general",         label: "General"          },
    { id: "notifications",   label: "Notifications"    },
    { id: "personalization", label: "Personalization"  },
    { id: "security",        label: "Security & login" },
    { id: "account",         label: "Account"          },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-10 h-6 rounded-full relative transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "right-1" : "left-1"}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 h-[85vh] flex overflow-hidden">

        {/* Sidebar */}
        <div className="w-52 border-r border-gray-100 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Settings</span>
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="py-2 flex-1 overflow-y-auto">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition rounded-lg mx-1 ${
                  section === item.id
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={{ width: "calc(100% - 8px)" }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* General */}
          {section === "general" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-6">General</h2>

              <div className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Appearance</span>
                  <select value={appearance} onChange={e => setAppearance(e.target.value)}
                    className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                    <option>System</option>
                    <option>Dark</option>
                    <option>Light</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Language</span>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                    <option>Auto-detect</option>
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Chinese</option>
                    <option>Japanese</option>
                    <option>Russian</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-6">Notifications</h2>
              <div className="space-y-0">
                {[
                  { key: "priceAlerts",   label: "Price alerts",    desc: "Get notified when your target price is hit"     },
                  { key: "tradeFills",    label: "Trade fills",     desc: "Get notified when your limit order fills"       },
                  { key: "marketUpdates", label: "Market updates",  desc: "Weekly MLB performance and card market summary" },
                  { key: "newListings",   label: "New listings",    desc: "Get notified when new cards are listed"         },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <select
                      value={notifications[item.key as keyof typeof notifications]}
                      onChange={e => setNotifications(prev => ({ ...prev, [item.key]: e.target.value }))}
                      className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
                    >
                      <option>Push</option>
                      <option>Email</option>
                      <option>Push, Email</option>
                      <option>Off</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personalization */}
          {section === "personalization" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-6">Personalization</h2>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900">Favorite team</p>
                    <p className="text-xs text-gray-400 mt-0.5">Highlight cards from your favorite MLB team</p>
                  </div>
                  <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                    <option>None</option>
                    <option>New York Yankees</option>
                    <option>Los Angeles Dodgers</option>
                    <option>Boston Red Sox</option>
                    <option>Chicago Cubs</option>
                    <option>Houston Astros</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900">Default tab</p>
                    <p className="text-xs text-gray-400 mt-0.5">Which tab opens when you launch the app</p>
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
                    <p className="text-sm text-gray-900">Show AI signals</p>
                    <p className="text-xs text-gray-400 mt-0.5">Show BUY/HOLD/SELL signals on player cards</p>
                  </div>
                  <Toggle value={aiSignals} onChange={() => setAiSignals(v => !v)} />
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Security and login</h2>

              <div className="space-y-0 mb-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-900">Password</span>
                  <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
                    Add
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900">Security keys & passkeys</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use hardware keys or passkeys to sign in</p>
                  </div>
                  <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
                    Add
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-2">Multi-factor authentication (MFA)</h3>
              <div className="space-y-0 mb-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900">Authenticator app</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use one-time codes from an authenticator app</p>
                  </div>
                  <Toggle value={mfaApp} onChange={() => setMfaApp(v => !v)} />
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900">Text message</p>
                    <p className="text-xs text-gray-400 mt-0.5">Get 6-digit verification codes via SMS</p>
                  </div>
                  <Toggle value={mfaSms} onChange={() => setMfaSms(v => !v)} />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-2">Sessions</h3>
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-900">Active sessions</p>
                  <p className="text-xs text-gray-400 mt-0.5">View all devices that have accessed your account</p>
                </div>
                <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
                  2
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Account */}
          {section === "account" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-6">Account</h2>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Name</span>
                  <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
                    Edit
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Email</span>
                  <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
                    Edit
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Connected wallet</span>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Connect
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-900">Delete account</p>
                    <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all data</p>
                  </div>
                  <button className="px-4 py-1.5 rounded-full border border-red-300 text-sm text-red-600 hover:bg-red-50 transition">
                    Delete
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