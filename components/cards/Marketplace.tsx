"use client";

import { useEffect, useState, useCallback } from "react";
import Image                                from "next/image";
import type { Listing }                     from "@/lib/listings";
import DynamicBuyButton                     from "@/components/cards/DynamicBuyButton";
import { subscribeToListings }              from "@/lib/realtime";
import { supabase }                         from "@/lib/supabase";

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/cards/listings");
      const json = await res.json();
      setListings(json.listings ?? []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Realtime — update instantly when anyone lists or buys
    const channel = subscribeToListings(load);
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-gray-900 font-black text-base">Marketplace</h3>
          <p className="text-gray-400 text-xs mt-0.5">Buy cards with USDC · Dynamic wallet</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm mb-1">No listings yet</p>
          <p className="text-gray-300 text-xs">Be the first — list a card in the sidebar</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
              <div className="shrink-0 w-12 h-16 rounded-lg overflow-hidden relative"
                style={{ background: "linear-gradient(135deg, #1e3a5f, #0d1b2a)" }}>
                <Image
                  src={listing.imageUrl}
                  alt={listing.playerName}
                  width={48}
                  height={64}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-black text-sm truncate">{listing.playerName}</p>
                <p className="text-gray-400 text-xs truncate">{listing.cardName} · {listing.grade}</p>
                <p className="text-gray-400 text-xs">
                  Seller: {listing.sellerName}
                  {listing.sellerWallet && (
                    <span className="ml-1 font-mono">
                      ({listing.sellerWallet.slice(0, 6)}...{listing.sellerWallet.slice(-4)})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-gray-900 font-black text-lg">${listing.priceUSD}</p>
                <p className="text-purple-500 text-xs font-semibold mb-2">{listing.priceUSD} USDC</p>
                {listing.sold ? (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400">SOLD</span>
                ) : (
                  <DynamicBuyButton listing={listing} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}