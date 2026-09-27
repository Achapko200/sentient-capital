"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter }                    from "next/navigation";
import { supabase }                     from "@/lib/supabase";

type ScanResult = {
  player: string;
  year: string;
  set: string;
  condition: string | null;
  psaGrade: number | null;
  valueMin: number | null;
  valueMax: number | null;
  observations: string[];
};

const MAX_INPUT_BYTES = 25 * 1024 * 1024; // before resizing
const MAX_DIMENSION   = 1600;              // px, longest side after resizing
const JPEG_QUALITY    = 0.85;

// Resize and convert any photo to a JPEG data URL so it stays well under the 4 MB API limit
async function toJpegDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload  = () => resolve(i);
      i.onerror = reject;
      i.src     = url;
    });
    const scale  = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

const money = (n: number | null) => (n === null ? "—" : `$${n.toLocaleString("en-US")}`);

export default function ScanPage() {
  const router                      = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);
  const cameraRef                   = useRef<HTMLInputElement>(null);
  const [image,     setImage]       = useState<string | null>(null);
  const [preparing, setPreparing]   = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [result,    setResult]      = useState<ScanResult | null>(null);
  const [error,     setError]       = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const res = await fetch(`/api/subscription?userId=${data.user.id}`, { headers: await authHeaders() });
      const sub = await res.json().catch(() => ({}));
      if (!sub.tier || sub.tier === "free") {
        router.push("/pricing");
        return;
      }
      setAuthorized(true);
    });
  }, [router]);

  if (!authorized) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleFile = async (file: File) => {
    setResult(null);
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("Image too large — max 25 MB.");
      return;
    }
    setPreparing(true);
    try {
      setImage(await toJpegDataUrl(file));
    } catch {
      setError("Couldn't read that image. Try a JPG or PNG photo.");
    } finally {
      setPreparing(false);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/cards/scan", {
        method:  "POST",
        headers: await authHeaders(),
        body:    JSON.stringify({ image }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to scan card.");
      setResult(data.card);
    } catch (err: any) {
      setError(err?.message ?? "Failed to scan card.");
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (grade: number | null) => {
    if (grade === null) return "text-gray-400";
    if (grade >= 9) return "text-green-400";
    if (grade >= 7) return "text-yellow-400";
    return "text-red-400";
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ""; // allow picking the same file again
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} aria-label="Back" className="text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-black text-lg">Card Scanner</h1>
          <p className="text-gray-400 text-xs">AI-powered card identification & valuation</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 transition"
        >
          {preparing ? (
            <div className="py-10 flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : image ? (
            <img src={image} alt="Card" className="max-h-64 mx-auto rounded-xl object-contain" />
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto text-3xl">
                📸
              </div>
              <div>
                <p className="text-gray-300 font-semibold">Take a photo or upload</p>
                <p className="text-gray-500 text-sm mt-1">Any photo — we'll resize it automatically</p>
              </div>
            </div>
          )}
        </div>

        {!image && !preparing && (
          <div className="flex gap-3">
            <button onClick={() => cameraRef.current?.click()}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white transition text-sm font-medium">
              Take photo
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white transition text-sm font-medium">
              Choose from library
            </button>
          </div>
        )}

        {/* Library picker */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        {/* Camera */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />

        {image && (
          <div className="flex gap-3">
            <button
              onClick={() => { setImage(null); setResult(null); setError(""); }}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={handleScan}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-black text-sm transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
            >
              {loading ? "Scanning..." : "🔍 Scan Card"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-800 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="font-black text-xl">{result.player || "Unknown player"}</h2>
              <p className="text-gray-400 text-sm">{[result.year, result.set].filter(Boolean).join(" ") || "Set not identified"}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs mb-1">Condition</p>
                <p className="text-white font-bold text-sm">{result.condition ?? "—"}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs mb-1">Est. PSA Grade</p>
                <p className={`font-black text-2xl ${gradeColor(result.psaGrade)}`}>{result.psaGrade ?? "—"}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs mb-1">Est. Value</p>
                <p className="text-green-400 font-bold text-sm">
                  {result.valueMin === null && result.valueMax === null ? "—" : `${money(result.valueMin)}–${money(result.valueMax)}`}
                </p>
              </div>
            </div>

            {/* Observations */}
            {result.observations?.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">AI Observations</p>
                <div className="space-y-2">
                  {result.observations.map((obs, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-blue-400 text-xs mt-0.5">•</span>
                      <p className="text-gray-300 text-sm">{obs}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="px-5 pb-4 text-gray-500 text-xs">
              Grade and value are AI estimates from a photo, not an official PSA grade or appraisal.
            </p>

            {/* Actions */}
            {result.player && (
              <div className="px-5 py-4 border-t border-gray-800 space-y-2">
                <button
                  onClick={() => router.push("/app")}
                  className="w-full py-3 rounded-xl font-bold text-sm transition"
                  style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
                >
                  📊 Trade {result.player} cards
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {!result && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Tips for best results</p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>📷 Good lighting, no glare</p>
              <p>🎯 Center the card in frame</p>
              <p>📐 Keep card flat and straight</p>
              <p>🔍 Capture the full front of the card</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
