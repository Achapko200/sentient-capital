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
    <div className="fixed bottom-0 left-0 right-0 z-[400] p-4 animate-slide-up">
      <div className="max-w-lg mx-auto rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <div className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            ⚾
          </div>
          <div className="flex-1">
            <p className="font-black text-white text-sm">Add Card Tracker to Home Screen</p>
            {isIOS ? (
              <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                Tap <strong style={{ color: "#ccc" }}>Share</strong> then <strong style={{ color: "#ccc" }}>Add to Home Screen</strong>
              </p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                Get the full app experience — faster and works offline
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {!isIOS && (
              <button onClick={handleInstall}
                className="px-4 py-2 rounded-xl text-xs font-black text-black transition"
                style={{ backgroundColor: "#00c278" }}>
                Install
              </button>
            )}
            <button onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition"
              style={{ color: "#888", backgroundColor: "#2a2a2a" }}>
              {isIOS ? "Got it" : "Not now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
