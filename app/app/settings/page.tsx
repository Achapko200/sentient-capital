"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { supabase }            from "@/lib/supabase";

type Section =
  | "general"
  | "notifications"
  | "personalization"
  | "security"
  | "datacontrols"
  | "safety"
  | "account";

function MFAModal({
  onClose,
  onEnableApp,
}: {
  onClose:     () => void;
  onEnableApp: () => void;
}) {
  const [step,        setStep]        = useState<"start" | "scan">("start");
  const [qrCodeUrl,   setQrCodeUrl]   = useState("");
  const [secret,      setSecret]      = useState("");
  const [factorId,    setFactorId]    = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code,        setCode]        = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  const startEnrollment = async () => {
    setLoading(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Please sign in again"); setLoading(false); return; }

      const res  = await fetch("/api/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "enroll", accessToken: session.access_token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setFactorId(data.factorId);

      // Start challenge
      const cRes  = await fetch("/api/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "challenge", accessToken: session.access_token, factorId: data.factorId }),
      });
      const cData = await cRes.json();
      if (cData.success) setChallengeId(cData.challengeId);

      setStep("scan");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length < 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Please sign in again"); return; }

      const res  = await fetch("/api/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "verify", accessToken: session.access_token, factorId, challengeId, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid code — try again"); return; }
      onEnableApp();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setError("Secret key copied!");
    } catch {
      setError("Copy failed — type the key manually");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 sticky top-0 bg-white z-10">
          {step === "scan" && (
            <button onClick={() => { setStep("start"); setError(""); setCode(""); }}
              className="text-gray-400 hover:text-gray-600 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h3 className="font-semibold text-gray-900 flex-1">Set up Authenticator</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Start */}
        {step === "start" && (
          <div className="px-6 py-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Use an authenticator app to generate one-time codes when you log in. Works with Microsoft Authenticator, Google Authenticator, Authy, and 1Password.
              </p>
            </div>
            {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}
            <button onClick={startEnrollment} disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? "Setting up..." : "Set up authenticator"}
            </button>
            <button onClick={onClose}
              className="w-full mt-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        )}

        {/* Scan QR */}
        {step === "scan" && (
          <div className="px-6 py-5">
            <div className="space-y-4 mb-5">

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Open your Authenticator app</p>
                  <p className="text-xs text-gray-400 mt-0.5">Microsoft Authenticator, Google Authenticator, Authy, or 1Password</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Tap the QR scan icon inside the app</p>
                  <p className="text-xs text-gray-400 mt-0.5">Microsoft Authenticator: QR icon bottom right</p>
                  <p className="text-xs text-gray-400">Google Authenticator: tap + → Scan QR code</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-3 border-2 border-gray-200 rounded-xl">
                  {qrCodeUrl
                    ? <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44" />
                    : <div className="w-44 h-44 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                        <p className="text-xs text-gray-400">Loading...</p>
                      </div>
                  }
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Can&apos;t scan? Enter this key manually:</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-gray-900 font-bold text-xs tracking-wider break-all">{secret}</span>
                  <button onClick={handleCopy} className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0">Copy</button>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-900 font-medium">Enter the 6-digit code from the app</p>
              </div>
            </div>

            <input type="text" maxLength={6} value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="000000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:border-blue-400"
            />
            {error && (
              <p className={`text-xs mt-1.5 ${error.includes("copied") ? "text-green-600" : "text-red-500"}`}>
                {error}
              </p>
            )}
            <button onClick={handleVerify} disabled={loading}
              className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & enable"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("general");

  const [appearance,       setAppearance]       = useState("System");
  const [contrast,         setContrast]         = useState("System");
  const [accent,           setAccent]           = useState("Default");
  const [language,         setLanguage]         = useState("Auto-detect");
  const [mfaBanner,        setMfaBanner]        = useState(true);
  const [showMFA,          setShowMFA]          = useState(false);
  const [mfaApp,           setMfaApp]           = useState(false);
  const [aiSignals,        setAiSignals]        = useState(true);
  const [alertsBadge,      setAlertsBadge]      = useState(true);
  const [priceImpact,      setPriceImpact]      = useState(true);
  const [favoriteTeam,     setFavoriteTeam]     = useState("None");
  const [defaultTab,       setDefaultTab]       = useState("Card Tracker");
  const [sensitiveContent, setSensitiveContent] = useState(false);
  const [safeTrading,      setSafeTrading]      = useState(true);
  const [impactWarnings,   setImpactWarnings]   = useState(true);
  const [marketingMeasure, setMarketingMeasure] = useState(true);
  const [personalizedMkt,  setPersonalizedMkt]  = useState(true);
  const [notifs, setNotifs] = useState({
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
    <button onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${value ? "bg-blue-600" : "bg-gray-300"}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${value ? "right-0.5" : "left-0.5"}`} />
    </button>
  );

  const SelectRow = ({ label, desc, value, options, onChange }: {
    label: string; desc?: string; value: string; options: string[]; onChange: (v: string) => void;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
      <div>
        <p className="text-sm text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-xs">{desc}</p>}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer shrink-0 mt-0.5">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  const ToggleRow = ({ label, desc, value, onChange }: {
    label: string; desc?: string; value: boolean; onChange: () => void;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
      <div>
        <p className="text-sm text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-xs">{desc}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );

  const ChevronRow = ({ label, desc, right }: { label: string; desc?: string; right?: string }) => (
    <button className="w-full flex items-start justify-between py-4 border-b border-gray-100 gap-6 hover:bg-gray-50 transition text-left -mx-8 px-8">
      <div>
        <p className="text-sm text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-xs">{desc}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0 text-sm text-gray-500 mt-0.5">
        {right && <span>{right}</span>}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-1">{title}</h3>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-2 h-[90vh] flex overflow-hidden">

        {/* Sidebar */}
        <div className="w-36 md:w-52 border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">
          <div className="flex items-center justify-between px-4 py-[18px] border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Settings</span>
            <button onClick={() => router.back()}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="py-2 flex-1 overflow-y-auto">
            {NAV.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`w-[calc(100%-16px)] mx-2 text-left px-3 py-2 text-sm rounded-lg transition ${
                  section === item.id
                    ? "bg-white shadow-sm text-gray-900 font-medium border border-gray-200"
                    : "text-gray-500 hover:bg-white hover:text-gray-700"
                }`}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">

            {section === "general" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">General</h2>
              {mfaBanner && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 relative">
                  <button onClick={() => setMfaBanner(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Secure your account</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed pr-6">Add multi-factor authentication (MFA) to help protect your account when logging in.</p>
                      <button onClick={() => setShowMFA(true)}
                        className="mt-2.5 px-4 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-100 transition">
                        Set up MFA
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <SelectRow label="Appearance"   value={appearance} onChange={setAppearance} options={["System","Dark","Light"]} />
              <SelectRow label="Contrast"     value={contrast}   onChange={setContrast}   options={["System","Medium","Increased"]} />
              <SelectRow label="Accent color" value={accent}     onChange={setAccent}     options={["Default","Blue","Green","Yellow","Pink","Orange","Purple"]} />
              <SelectRow label="Language"     value={language}   onChange={setLanguage}   options={["Auto-detect","English (US)","Spanish","French","German","Russian","Chinese","Japanese"]} />
            </>)}

            {section === "notifications" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Notifications</h2>
              {[
                { key: "priceAlerts",   label: "Price alerts",    desc: "Get notified when your target price is hit"     },
                { key: "tradeFills",    label: "Trade fills",     desc: "Get notified when your limit order fills"       },
                { key: "marketUpdates", label: "Market updates",  desc: "Weekly MLB performance and card market summary" },
                { key: "newListings",   label: "New listings",    desc: "Get notified when new cards are listed"         },
              ].map(item => (
                <SelectRow key={item.key} label={item.label} desc={item.desc}
                  value={notifs[item.key as keyof typeof notifs]}
                  onChange={v => setNotifs(p => ({ ...p, [item.key]: v }))}
                  options={["Push","Email","Push, Email","Off"]} />
              ))}
            </>)}

            {section === "personalization" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Personalization</h2>
              <SelectRow label="Favorite team" desc="Highlight cards from your favorite MLB team"
                value={favoriteTeam} onChange={setFavoriteTeam}
                options={["None","New York Yankees","Los Angeles Dodgers","Boston Red Sox","Chicago Cubs","Houston Astros","Atlanta Braves","Philadelphia Phillies"]} />
              <SelectRow label="Default tab" desc="Which tab opens when you launch the app"
                value={defaultTab} onChange={setDefaultTab}
                options={["Card Tracker","Trade","Portfolio","Analyst Picks"]} />
              <ToggleRow label="Show AI signals"       desc="Show BUY/HOLD/SELL signals on player cards"                        value={aiSignals}   onChange={() => setAiSignals(v => !v)}   />
              <ToggleRow label="Show alerts badge"     desc="Show unread alerts count on the Alerts tab"                        value={alertsBadge} onChange={() => setAlertsBadge(v => !v)} />
              <ToggleRow label="Price impact warnings" desc="Alert me when a trade would move the market price by more than 5%" value={priceImpact} onChange={() => setPriceImpact(v => !v)} />
            </>)}

            {section === "security" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Security and login</h2>
              <ChevronRow label="Password" />
              <ChevronRow label="Security keys & passkeys"
                desc="Use hardware security keys or passkeys to sign in. These phishing-resistant methods provide stronger protection than passwords."
                right="Add" />
              <SectionTitle title="Multi-factor authentication (MFA)" />
              <ToggleRow label="Authenticator app" desc="Use one-time codes from an authenticator app — free and works offline"
                value={mfaApp} onChange={() => { if (!mfaApp) setShowMFA(true); else setMfaApp(false); }} />
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
                <div>
                  <p className="text-sm text-gray-900">Text message (SMS)</p>
                  <p className="text-xs text-gray-400 mt-0.5">Coming soon — requires Pro plan</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-0.5 px-2 py-1 bg-gray-100 rounded-full">Soon</span>
              </div>
              <SectionTitle title="Sessions" />
              <ChevronRow label="Active sessions"
                desc="View all devices that have accessed your account. You can review active sessions, remove trusted devices, or log out all sessions."
                right="2" />
              <SectionTitle title="Advanced security" />
              <ChevronRow label="Advanced account security"
                desc="Adds the highest level of account security by requiring stronger sign-in methods."
                right="Enroll" />
              <ToggleRow label="Lockdown mode"
                desc="Helps protect sensitive data by limiting features that can connect to external services."
                value={false} onChange={() => {}} />
            </>)}

            {section === "datacontrols" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Data controls</h2>
              <ChevronRow label="Improve Card Tracker for everyone"
                desc="Allow us to use your anonymized trading data to improve signals and recommendations."
                right="On" />
              <ChevronRow label="Shared links"       desc="Manage links you've shared to your card analysis or portfolio" />
              <ChevronRow label="Archived positions" desc="View and restore archived trading positions" />
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
                <p className="text-sm text-gray-900">Archive all positions</p>
                <button className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 shrink-0">Archive all</button>
              </div>
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
                <p className="text-sm text-gray-900">Delete all trade history</p>
                <button className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-full hover:bg-red-50 shrink-0">Delete all</button>
              </div>
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
                <div>
                  <p className="text-sm text-gray-900">Export data</p>
                  <p className="text-xs text-gray-400 mt-0.5">Download a copy of your trades, positions, and account data</p>
                </div>
                <button className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 shrink-0">Export</button>
              </div>
              <SectionTitle title="Marketing privacy" />
              <ToggleRow label="Marketing measurement"
                desc="These cookies help us measure the effectiveness of our marketing campaigns."
                value={marketingMeasure} onChange={() => setMarketingMeasure(v => !v)} />
              <ToggleRow label="Personalized marketing"
                desc="This helps us personalize and measure Card Tracker's own marketing on third-party platforms."
                value={personalizedMkt} onChange={() => setPersonalizedMkt(v => !v)} />
            </>)}

            {section === "safety" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Safety</h2>
              <ToggleRow label="Reduce sensitive content"
                desc="Add extra safeguards around sensitive topics and limit certain types of content in Card Tracker."
                value={sensitiveContent} onChange={() => setSensitiveContent(v => !v)} />
              <ToggleRow label="Safe trading mode"
                desc="Show warnings before placing large orders or trades with high price impact."
                value={safeTrading} onChange={() => setSafeTrading(v => !v)} />
              <ToggleRow label="Price impact warnings"
                desc="Alert me when a trade would move the market price by more than 5%."
                value={impactWarnings} onChange={() => setImpactWarnings(v => !v)} />
            </>)}

            {section === "account" && (<>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Account</h2>
              <ChevronRow label="Name" />
              <ChevronRow label="Username" />
              <ChevronRow label="Email" />
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
                <div>
                  <p className="text-sm text-gray-900">Connected wallet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Link a crypto wallet for on-chain USDC trading on Base</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium shrink-0">Connect</button>
              </div>
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-6">
                <div>
                  <p className="text-sm text-gray-900">Delete account</p>
                  <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all associated data. This cannot be undone.</p>
                </div>
                <button className="px-4 py-1.5 rounded-full border border-red-300 text-sm text-red-600 hover:bg-red-50 transition shrink-0">
                  Delete
                </button>
              </div>
            </>)}

          </div>
        </div>
      </div>

      {showMFA && (
        <MFAModal
          onClose={() => setShowMFA(false)}
          onEnableApp={() => { setMfaApp(true); setShowMFA(false); }}
        />
      )}
    </div>
  );
}