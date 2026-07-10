"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = "general" | "notifications" | "personalization" | "security" | "account" | "datacontrols" | "safety";

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("general");
  const [appearance,   setAppearance]   = useState("System");
  const [language,     setLanguage]     = useState("Auto-detect");
  const [mfaApp,       setMfaApp]       = useState(false);
  const [mfaSms,       setMfaSms]       = useState(false);
  const [aiSignals,    setAiSignals]    = useState(true);
  const [sensitiveContent, setSensitiveContent] = useState(false);
  const [marketingMeasurement, setMarketingMeasurement] = useState(true);
  const [personalizedMarketing, setPersonalizedMarketing] = useState(true);
  const [notifications, setNotifications] = useState({
    priceAlerts:   "Email",
    tradeFills:    "Push",
    marketUpdates: "Email",
    newListings:   "Off",
  });

  const NAV: { id: Section; label: string }[] = [
    { id: "general",         label: "General"          },
    { id: "notifications",   label: "Notifications"    },
    { id: "personalization", label: "Personalization"  },
    { id: "security",        label: "Security & login" },
    { id: "datacontrols",    label: "Data controls"    },
    { id: "safety",          label: "Safety"           },
    { id: "account",         label: "Account"          },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${value ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "right-1" : "left-1"}`} />
    </button>
  );

  const Row = ({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 gap-4">
      <div className="min-w-0">
        <p className="text-sm text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );

  const ChevronBtn = ({ label }: { label: string }) => (
    <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
      {label}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
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
                className={`w-full text-left px-4 py-2.5 text-sm transition rounded-lg mx-1 ${
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
              <h2 className="text-base font-semibold text-gray-900 mb-4">General</h2>
              <Row label="Appearance" right={
                <select value={appearance} onChange={e => setAppearance(e.target.value)}
                  className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                  <option>System</option><option>Dark</option><option>Light</option>
                </select>
              } />
              <Row label="Contrast" right={
                <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                  <option>System</option><option>Medium</option><option>Increased</option>
                </select>
              } />
              <Row label="Accent color" right={
                <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                  <option>Default</option><option>Blue</option><option>Green</option>
                  <option>Yellow</option><option>Pink</option><option>Orange</option><option>Purple</option>
                </select>
              } />
              <Row label="Language" right={
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                  <option>Auto-detect</option><option>English (US)</option>
                  <option>Spanish</option><option>French</option>
                  <option>German</option><option>Russian</option><option>Chinese</option>
                </select>
              } />
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Notifications</h2>
              {[
                { key: "priceAlerts",   label: "Price alerts",    desc: "Get notified when your target price is hit"     },
                { key: "tradeFills",    label: "Trade fills",     desc: "Get notified when your limit order fills"       },
                { key: "marketUpdates", label: "Market updates",  desc: "Weekly MLB performance and card market summary" },
                { key: "newListings",   label: "New listings",    desc: "Get notified when new cards are listed"         },
              ].map(item => (
                <Row key={item.key} label={item.label} desc={item.desc} right={
                  <select
                    value={notifications[item.key as keyof typeof notifications]}
                    onChange={e => setNotifications(prev => ({ ...prev, [item.key]: e.target.value }))}
                    className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    <option>Push</option><option>Email</option>
                    <option>Push, Email</option><option>Off</option>
                  </select>
                } />
              ))}
            </div>
          )}

          {/* Personalization */}
          {section === "personalization" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Personalization</h2>
              <Row label="Favorite team" desc="Highlight cards from your favorite MLB team" right={
                <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                  <option>None</option>
                  <option>New York Yankees</option><option>Los Angeles Dodgers</option>
                  <option>Boston Red Sox</option><option>Chicago Cubs</option>
                  <option>Houston Astros</option><option>Atlanta Braves</option>
                </select>
              } />
              <Row label="Default tab" desc="Which tab opens when you launch the app" right={
                <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer">
                  <option>Card Tracker</option><option>Trade</option>
                  <option>Portfolio</option><option>Analyst Picks</option>
                </select>
              } />
              <Row label="Show AI signals" desc="Show BUY/HOLD/SELL signals on player cards"
                right={<Toggle value={aiSignals} onChange={() => setAiSignals(v => !v)} />}
              />
              <Row label="Show price alerts badge" desc="Show unread alerts count on the Alerts tab"
                right={<Toggle value={true} onChange={() => {}} />}
              />
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Security and login</h2>
              <Row label="Password" right={<ChevronBtn label="Add" />} />
              <Row label="Security keys & passkeys"
                desc="Use hardware keys or passkeys to sign in. These phishing-resistant methods provide stronger protection."
                right={<ChevronBtn label="Add" />}
              />

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Multi-factor authentication (MFA)</h3>
              <Row label="Authenticator app" desc="Use one-time codes from an authenticator app"
                right={<Toggle value={mfaApp} onChange={() => setMfaApp(v => !v)} />}
              />
              <Row label="Text message" desc="Get 6-digit verification codes via SMS based on your country code"
                right={<Toggle value={mfaSms} onChange={() => setMfaSms(v => !v)} />}
              />

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Advanced security</h3>
              <Row label="Advanced account security"
                desc="Adds the highest level of account security by requiring stronger sign-in methods."
                right={<ChevronBtn label="Enroll" />}
              />
              <Row label="Lockdown mode"
                desc="Helps protect sensitive data by limiting features that can connect to external services."
                right={<Toggle value={false} onChange={() => {}} />}
              />

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Sessions</h3>
              <Row label="Active sessions"
                desc="View all devices that have accessed your account. You can remove trusted devices or log out all sessions."
                right={<ChevronBtn label="2" />}
              />
            </div>
          )}

          {/* Data controls */}
          {section === "datacontrols" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Data controls</h2>
              <Row label="Improve Card Tracker for everyone"
                desc="Allow us to use your trading data to improve signals and recommendations for all users."
                right={<ChevronBtn label="On" />}
              />
              <Row label="Shared links"
                desc="Manage links you've shared to your card analysis or portfolio"
                right={<button className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50">Manage</button>}
              />
              <Row label="Export data"
                desc="Download a copy of your trades, positions, and account data"
                right={<button className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50">Export</button>}
              />
              <Row label="Delete all trade history"
                desc="Permanently delete your trade history. This cannot be undone."
                right={<button className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-full hover:bg-red-50">Delete all</button>}
              />

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Marketing privacy</h3>
              <Row label="Marketing measurement"
                desc="These cookies help us measure the effectiveness of our marketing campaigns."
                right={<Toggle value={marketingMeasurement} onChange={() => setMarketingMeasurement(v => !v)} />}
              />
              <Row label="Personalized marketing"
                desc="This helps us personalize and measure our own marketing on third-party platforms."
                right={<Toggle value={personalizedMarketing} onChange={() => setPersonalizedMarketing(v => !v)} />}
              />
            </div>
          )}

          {/* Safety */}
          {section === "safety" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Safety</h2>
              <Row label="Reduce sensitive content"
                desc="Add extra safeguards around sensitive topics and limit certain types of content in Card Tracker."
                right={<Toggle value={sensitiveContent} onChange={() => setSensitiveContent(v => !v)} />}
              />
              <Row label="Safe trading mode"
                desc="Show warnings before placing large orders or trades with high price impact."
                right={<Toggle value={true} onChange={() => {}} />}
              />
              <Row label="Price impact warnings"
                desc="Alert me when a trade would move the market price by more than 5%."
                right={<Toggle value={true} onChange={() => {}} />}
              />
            </div>
          )}

          {/* Account */}
          {section === "account" && (
            <div className="px-8 py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Account</h2>
              <Row label="Name"     right={<ChevronBtn label="Edit" />} />
              <Row label="Username" right={<ChevronBtn label="Edit" />} />
              <Row label="Email"    right={<ChevronBtn label="Edit" />} />
              <Row label="Connected wallet"
                desc="Link a crypto wallet for on-chain USDC trading on Base"
                right={<button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Connect</button>}
              />
              <Row label="Delete account"
                desc="Permanently delete your account and all associated data. This cannot be undone."
                right={
                  <button className="px-4 py-1.5 rounded-full border border-red-300 text-sm text-red-600 hover:bg-red-50 transition">
                    Delete
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}