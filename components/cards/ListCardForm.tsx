"use client";

import { useState, useEffect, useRef } from "react";
import { supabase }            from "@/lib/supabase";
import { useAuth }             from "@/lib/auth-context";

const GRADES = ["PSA 10", "PSA 9", "PSA 8", "BGS 9.5", "BGS 9", "SGC 10", "SGC 9.5"];

type Props = { onSuccess?: () => void };

export default function ListCardForm({ onSuccess }: Props) {
  const { email } = useAuth();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [players,     setPlayers]     = useState<string[]>([]);
  const [step,        setStep]        = useState<1 | 2 | 3>(1);
  const [playerName,  setPlayerName]  = useState("");
  const [customName,  setCustomName]  = useState("");
  const [cardYear,    setCardYear]    = useState("");
  const [cardSet,     setCardSet]     = useState("");
  const [grade,       setGrade]       = useState("PSA 10");
  const [certNumber,  setCertNumber]  = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images,      setImages]      = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    fetch("/api/cards/players")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.players ?? []);
        setPlayers([...list.map((p: any) => p.name), "Other"]);
      })
      .catch(() => setPlayers(["Other"]));
  }, []);

  const name = playerName === "Other" ? customName : playerName;
  const fee  = askingPrice ? (parseFloat(askingPrice) * 0.05).toFixed(2) : "0.00";
  const payout = askingPrice ? (parseFloat(askingPrice) * 0.95).toFixed(2) : "0.00";

  const handleImage = (file: File) => {
    if (images.length >= 4) return;
    const reader = new FileReader();
    reader.onload = e => setImages(prev => [...prev, e.target?.result as string]);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!email) { setError("Sign in to list a card"); return; }
    if (!name || !cardYear || !grade || !askingPrice) { setError("Fill in all required fields"); return; }
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sign in to list"); return; }

      const { error: dbError } = await supabase.from("listings").insert({
        player_id:    name.toLowerCase().replace(/\s+/g, "-"),
        player_name:  name,
        card_name:    `${cardYear} ${cardSet} ${grade}`,
        grade,
        price_usd:    parseFloat(askingPrice),
        seller_wallet: `email:${email}`,
        seller_name:  email.split("@")[0],
        image_url:    images[0] ?? "",
        cert_number:  certNumber,
        description,
        status:       "pending_review",
        user_id:      user.id,
      });

      if (dbError) throw dbError;
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message ?? "Failed to list card");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="text-xl font-black text-gray-900 mb-2">Card listed!</h3>
      <p className="text-gray-500 text-sm mb-2">Your card is pending review. Once approved it will appear in the marketplace.</p>
      <p className="text-gray-500 text-sm">We&apos;ll email you with next steps for shipping your card to the vault.</p>
      <button onClick={() => { setSuccess(false); setStep(1); setPlayerName(""); setImages([]); setAskingPrice(""); }}
        className="mt-6 px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition">
        List another card
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-black text-gray-900">Sell a Card</h2>
        <p className="text-gray-500 text-xs mt-0.5">List your PSA-graded card on the marketplace</p>
      </div>

      {/* Progress steps */}
      <div className="flex border-b border-gray-100">
        {[
          { n: 1, label: "Card Details" },
          { n: 2, label: "Photos & Price" },
          { n: 3, label: "Review" },
        ].map(s => (
          <button key={s.n} onClick={() => step > s.n && setStep(s.n as 1|2|3)}
            className={`flex-1 py-3 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              step === s.n ? "border-b-2 border-gray-900 text-gray-900" :
              step > s.n  ? "text-green-600" : "text-gray-400"
            }`}>
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
              step > s.n ? "bg-green-100 text-green-600" :
              step === s.n ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {step > s.n ? "✓" : s.n}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">

        {/* Step 1: Card Details */}
        {step === 1 && (<>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Player Name *</label>
            <select value={playerName} onChange={e => setPlayerName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
              <option value="">Select player...</option>
              {players.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {playerName === "Other" && (
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="Enter player name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 mt-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Card Year *</label>
              <input type="text" value={cardYear} onChange={e => setCardYear(e.target.value)}
                placeholder="e.g. 2019"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Card Set</label>
              <input type="text" value={cardSet} onChange={e => setCardSet(e.target.value)}
                placeholder="e.g. Topps Chrome"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Grade *</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Cert Number</label>
              <input type="text" value={certNumber} onChange={e => setCertNumber(e.target.value)}
                placeholder="PSA cert #"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Any additional details about the card..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-none" />
          </div>

          <button onClick={() => {
            if (!name || !cardYear || !grade) { setError("Fill in required fields"); return; }
            setError(""); setStep(2);
          }}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition">
            Continue →
          </button>
        </>)}

        {/* Step 2: Photos & Price */}
        {step === 2 && (<>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Card Photos ({images.length}/4)</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={img} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    ×
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button onClick={() => fileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-gray-400 transition text-2xl">
                  +
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
            <p className="text-xs text-gray-400">Add front, back, and any notable features</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Asking Price (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
              <input type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)}
                placeholder="0.00" min="1"
                className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
            </div>
          </div>

          {askingPrice && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Asking price</span>
                <span className="text-gray-900">${parseFloat(askingPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee (5%)</span>
                <span className="text-gray-500">-${fee}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
                <span className="text-gray-700">You receive</span>
                <span className="text-green-600">${payout}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">
              ← Back
            </button>
            <button onClick={() => {
              if (!askingPrice) { setError("Enter asking price"); return; }
              setError(""); setStep(3);
            }}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition">
              Continue →
            </button>
          </div>
        </>)}

        {/* Step 3: Review */}
        {step === 3 && (<>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Review your listing</h3>
            {[
              { label: "Player",     value: name },
              { label: "Card",       value: `${cardYear} ${cardSet}` },
              { label: "Grade",      value: grade },
              { label: "Cert #",     value: certNumber || "Not provided" },
              { label: "Price",      value: `$${parseFloat(askingPrice).toFixed(2)}` },
              { label: "You receive",value: `$${payout}` },
              { label: "Photos",     value: `${images.length} uploaded` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{r.label}</span>
                <span className="text-gray-900 font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">📦 Next steps after listing:</p>
            <p>1. We review your listing (24-48 hours)</p>
            <p>2. Once approved, ship card to our vault</p>
            <p>3. We verify and list it on the marketplace</p>
            <p>4. When sold, you get paid within 3-5 business days</p>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition disabled:opacity-50">
              {loading ? "Submitting..." : "List Card"}
            </button>
          </div>
        </>)}

        {error && step !== 3 && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    </div>
  );
}
