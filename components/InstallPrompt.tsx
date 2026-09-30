"use client";
// iPhone-only choice: "Get the app" or "Continue on website".
// With NEXT_PUBLIC_IOS_APP_ID set, Safari's Smart App Banner shows "Open" if the app is installed, "Get" if not.
// Without it, "Get the app" shows Add to Home Screen steps. Never shown inside the installed app or on other devices.
import { useEffect, useState } from "react";

const APP_ID = process.env.NEXT_PUBLIC_IOS_APP_ID ?? "";
const KEY    = "ct-app-choice";

export default function InstallPrompt() {
  const [show,  setShow]  = useState(false);
  const [howTo, setHowTo] = useState(false);

  useEffect(() => {
    const iphone     = /iPhone|iPod/.test(navigator.userAgent);
    const standalone = (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    let chosen = false;
    try { chosen = !!localStorage.getItem(KEY); } catch {}
    if (iphone && !standalone && !chosen) setShow(true);
  }, []);

  const remember = (choice: string) => { try { localStorage.setItem(KEY, choice); } catch {} };

  return (
    <>
      {APP_ID && <meta name="apple-itunes-app" content={`app-id=${APP_ID}`} />}

      {show && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/40" onClick={() => { remember("web"); setShow(false); }}>
          <div className="w-full rounded-t-3xl bg-white p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="" className="h-14 w-14 rounded-2xl" />
              <div>
                <p className="text-lg font-bold text-gray-900">Card Tracker for iPhone</p>
                <p className="text-sm text-gray-500">Faster, full-screen, one tap from your home screen.</p>
              </div>
            </div>

            {!howTo ? (
              <div className="mt-6 space-y-3">
                {APP_ID ? (
                  <a href={`https://apps.apple.com/app/id${APP_ID}`} onClick={() => remember("app")}
                    className="block w-full rounded-2xl bg-blue-600 py-3.5 text-center text-base font-bold text-white">Get the app</a>
                ) : (
                  <button onClick={() => setHowTo(true)}
                    className="w-full rounded-2xl bg-blue-600 py-3.5 text-base font-bold text-white">Get the app</button>
                )}
                <button onClick={() => { remember("web"); setShow(false); }}
                  className="w-full rounded-2xl border border-gray-200 py-3.5 text-base font-semibold text-gray-700">Continue on website</button>
                {APP_ID && <p className="text-center text-xs text-gray-400">Already have it? Tap <b>Open</b> in the banner at the top of Safari.</p>}
              </div>
            ) : (
              <div className="mt-6">
                <ol className="space-y-3 text-[15px] text-gray-700">
                  <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">1</span>
                    Tap the <b>Share</b> button <span aria-hidden>⬆︎</span> at the bottom of Safari.</li>
                  <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">2</span>
                    Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</li>
                </ol>
                <button onClick={() => { remember("app"); setShow(false); }}
                  className="mt-6 w-full rounded-2xl bg-gray-900 py-3.5 text-base font-bold text-white">Got it</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
