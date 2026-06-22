"use client";

import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const PLAYERS = [
  { id: "683002", name: "Paul Skenes",      image: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/683002/headshot/67/current" },
  { id: "660670", name: "Ronald Acuña Jr.", image: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660670/headshot/67/current" },
  { id: "671939", name: "Gunnar Henderson", image: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/671939/headshot/67/current" },
  { id: "682998", name: "Jackson Holliday", image: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/682998/headshot/67/current" },
  { id: "808967", name: "Wyatt Langford",   image: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/808967/headshot/67/current" },
  { id: "694973", name: "Julio Rodriguez",  image: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/694973/headshot/67/current" },
];

const GRADES = ["PSA 10", "PSA 9", "PSA 8", "BGS 9.5", "BGS 9", "Raw"];

type Props = { onSuccess: () => void };

export default function ListCardForm({ onSuccess }: Props) {
  const { primaryWallet, user } = useDynamicContext();
  const [playerId,  setPlayerId]  = useState(PLAYERS[0].id);
  const [cardName,  setCardName]  = useState("");
  const [grade,     setGrade]     = useState("PSA 10");
  const [priceUSD,  setPriceUSD]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  const selectedPlayer = PLAYERS.find((p) => p.id === playerId)!;

  const handleSubmit = async () => {
    if (!user || !primaryWallet) {
      setError("Connect your wallet first");
      return;
    }
    if (!cardName || !priceUSD) {
      setError("Fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cards/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          playerName:   selectedPlayer.name,
          cardName,
          grade,
          priceUSD:     parseFloat(priceUSD),
          sellerWallet: primaryWallet.address,
          sellerName:   primaryWallet.address.slice(0, 6) + "...",
          imageUrl:     selectedPlayer.image,
        }),
      });

      if (!res.ok) throw new Error("Failed to list card");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 2000);
    } catch {
      setError("Failed to list card — try again");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
        <p className="text-gray-500 text-sm mb-3">Connect your wallet to list a card</p>
        <p className="text-gray-400 text-xs">Use the Buy Cards tab to connect</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-green-300 shadow-sm p-6 text-center">
        <p className="text-4xl mb-2">✅</p>
        <p className="text-green-600 font-black text-lg">Card listed!</p>
        <p className="text-gray-400 text-sm mt-1">Your listing is now live</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-gray-900 font-black text-base mb-4">List a Card for Sale</h3>

      <div className="space-y-4">

        {/* Player */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Player</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
          >
            {PLAYERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Card name */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Card name</label>
          <input
            type="text"
            placeholder="e.g. 2024 Topps Chrome Rookie"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Grade */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Price (USDC)</label>
          <input
            type="number"
            placeholder="e.g. 285"
            value={priceUSD}
            onChange={(e) => setPriceUSD(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Listing..." : "List Card for Sale"}
        </button>

        <p className="text-gray-400 text-xs text-center">
          Listed from: {primaryWallet?.address?.slice(0, 6)}...{primaryWallet?.address?.slice(-4)}
        </p>
      </div>
    </div>
  );
}