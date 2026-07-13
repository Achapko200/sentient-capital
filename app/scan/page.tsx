"use client";

import { useState, useRef } from "react";
import { useRouter }        from "next/navigation";

export default function ScanPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image,   setImage]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<any>(null);
  const [error,   setError]   = useState("");

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError("");
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/cards/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.card);
    } catch (err: any) {
      setError(err.message ?? "Failed to scan card");
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (grade: number) => {
    if (grade >= 9) return "text-green-400";
    if (grade >= 7) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
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
          {image ? (
            <img src={image} alt="Card" className="max-h-64 mx-auto rounded-xl object-contain" />
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto text-3xl">
                📸
              </div>
              <div>
                <p className="text-gray-300 font-semibold">Take a photo or upload</p>
                <p className="text-gray-500 text-sm mt-1">JPG, PNG up to 10MB</p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {image && (
          <div className="flex gap-3">
            <button
              onClick={() => { setImage(null); setResult(null); }}
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
              <h2 className="font-black text-xl">{result.player}</h2>
              <p className="text-gray-400 text-sm">{result.year} {result.set}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs mb-1">Condition</p>
                <p className="text-white font-bold text-sm">{result.condition}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs mb-1">PSA Grade</p>
                <p className={`font-black text-2xl ${gradeColor(result.psaGrade)}`}>{result.psaGrade}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs mb-1">Est. Value</p>
                <p className="text-green-400 font-bold text-sm">${result.valueMin}–${result.valueMax}</p>
              </div>
            </div>

            {/* Observations */}
            {result.observations?.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">AI Observations</p>
                <div className="space-y-2">
                  {result.observations.map((obs: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-blue-400 text-xs mt-0.5">•</span>
                      <p className="text-gray-300 text-sm">{obs}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 py-4 border-t border-gray-800 space-y-2">
              <button
                onClick={() => router.push("/app")}
                className="w-full py-3 rounded-xl font-bold text-sm transition"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
              >
                📊 Trade {result.player} shares
              </button>
            </div>
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
