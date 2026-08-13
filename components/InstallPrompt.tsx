"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [show,        setShow]        = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS,       setIsIOS]       = useState(false);

  useEffect(() => {
    // Check if iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    if (isInstalled) return;

    // Check if dismissed
    const dismissed = sessionStorage.getItem("install_prompt_dismissed");
    if (dismissed) return;

    if (ios) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
      setDeferredPrompt(null);
    }
    sessionStorage.setItem("install_prompt_dismissed", "true");
    setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("install_prompt_dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}>

        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            ⚾
          </div>
          <h3 className="font-black text-white text-lg mb-1">Card Tracker</h3>
          <p className="text-sm" style={{ color: "#888" }}>
            {isIOS
              ? "Add to your Home Screen for the best experience"
              : "Install the app for a faster, full-screen experience"}
          </p>
        </div>

        {/* iOS instructions */}
        {isIOS && (
          <div className="mx-4 mb-4 p-3 rounded-xl text-xs text-center"
            style={{ backgroundColor: "#2a2a2a", color: "#ccc" }}>
            Tap <strong>Share ↑</strong> then <strong>Add to Home Screen</strong>
          </div>
        )}

        {/* Buttons */}
        <div className="p-4 space-y-2">
          {!isIOS && (
            <button onClick={handleInstall}
              className="w-full py-3 rounded-xl font-black text-sm text-black transition hover:opacity-90"
              style={{ backgroundColor: "#00c278" }}>
              📲 Install App
            </button>
          )}
          <button onClick={handleDismiss}
            className="w-full py-3 rounded-xl font-semibold text-sm transition"
            style={{ backgroundColor: "#2a2a2a", color: "#aaa" }}>
            Continue in Browser
          </button>
        </div>
      </div>
    </div>
  );
}
