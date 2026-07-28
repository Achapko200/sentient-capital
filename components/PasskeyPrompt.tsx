"use client";

import { useState, useEffect } from "react";
import { supabase }            from "@/lib/supabase";

export default function PasskeyPrompt() {
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const isMac     = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
  const isIPhone  = typeof navigator !== "undefined" && /iPhone/.test(navigator.userAgent);
  const isAndroid = typeof navigator !== "undefined" && /Android/.test(navigator.userAgent);
  const label     = isIPhone ? "Face ID" : isMac ? "Touch ID" : isAndroid ? "Fingerprint" : "Passkey";

  useEffect(() => {
    // Show prompt once per session if not dismissed
    const dismissed = sessionStorage.getItem("passkey_prompt_dismissed");
    if (dismissed) return;
    // Show after 2 seconds
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase.auth as any).registerPasskey({
        authenticatorAttachment: "platform",
      });
      if (error) throw error;
      localStorage.setItem("passkey_registered", "true");
      sessionStorage.setItem("passkey_prompt_dismissed", "true");
      setShow(false);
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("abort") || msg.includes("cancel")) {
        // User cancelled — don't show again this session
        sessionStorage.setItem("passkey_prompt_dismissed", "true");
      }
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("passkey_prompt_dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-3xl">
            {isIPhone ? "👤" : isMac ? "☝️" : isAndroid ? "👆" : "🔑"}
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">
            Enable {label}?
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Sign in instantly next time with {label} — no password needed.
          </p>
        </div>
        <div className="px-6 pb-6 pt-4 space-y-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition disabled:opacity-50">
            {loading ? "Setting up..." : `Enable ${label}`}
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
