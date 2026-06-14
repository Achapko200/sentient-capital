"use client";

import { useDynamicContext, DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";
import type { Listing } from "@/lib/listings";

export default function DynamicBuyButton({ listing }: { listing: Listing }) {
  const { primaryWallet, user } = useDynamicContext();
  const [step, setStep] = useState<"idle" | "paying" | "done">("idle");

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500 text-xs mb-2">Connect wallet to buy</p>
        <DynamicWidget />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-2">
        <p className="text-green-600 font-bold text-sm">Purchase complete!</p>
        <p className="text-gray-400 text-xs">{primaryWallet?.address?.slice(0,6)}...{primaryWallet?.address?.slice(-4)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
        <p className="text-gray-400 text-xs">Connected as</p>
        <p className="text-gray-900 font-bold text-xs font-mono">{primaryWallet?.address?.slice(0,6)}...{primaryWallet?.address?.slice(-4)}</p>
        <p className="text-purple-600 font-black text-lg mt-1">${listing.priceUSD} USDC</p>
      </div>
      <button
        onClick={() => setStep("done")}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition"
      >
        Pay {listing.priceUSD} USDC
      </button>
    </div>
  );
}