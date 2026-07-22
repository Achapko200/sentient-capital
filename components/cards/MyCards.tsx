"use client";
import React from "react";

import { useState, useEffect } from "react";
import { supabase }            from "@/lib/supabase";

type CardOrder = {
  id:         string;
  playerName: string;
  cardName:   string;
  price:      number;
  status:     string;
  type:       "buy" | "sell";
  createdAt:  string;
  address?:   string;
};

async function cancelOrder(id: string, setOrders: React.Dispatch<React.SetStateAction<CardOrder[]>>) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await supabase.from("card_orders").update({ status: "cancelled" }).eq("id", id);
  setOrders(prev => prev.filter(o => o.id !== id));
}

export default function MyCards() {
  const [orders,  setOrders]  = useState<CardOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const { data: orders } = await supabase
        .from("card_orders")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setOrders(orders ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">⚾</div>
      <h3 className="text-gray-900 font-black text-xl mb-2">No cards yet</h3>
      <p className="text-gray-500 text-sm mb-6">Browse the market and buy your first card</p>
      <a href="/app" className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition">
        Browse Cards
      </a>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">My Cards</h2>
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm ${
                order.type === "buy" ? "bg-green-600" : "bg-red-600"
              }`}>
                {order.type === "buy" ? "B" : "S"}
              </div>
              <div>
                <p className="font-bold text-gray-900">{order.playerName}</p>
                <p className="text-gray-500 text-xs">{order.cardName}</p>
                <p className="text-gray-400 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className="font-black text-gray-900">${order.price.toFixed(2)}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                order.status === "completed" ? "bg-green-100 text-green-700" :
                order.status === "shipping"  ? "bg-blue-100 text-blue-700" :
                order.status === "pending"   ? "bg-yellow-100 text-yellow-700" :
                                               "bg-gray-100 text-gray-600"
              }`}>
                {order.status}
              </span>
              {(order.status === "pending" || order.status === "paid") && (
                <button
                  onClick={() => cancelOrder(order.id, setOrders)}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-0.5 rounded-full transition">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
