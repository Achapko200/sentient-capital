"use client";

import { useState, useEffect } from "react";
import { supabase }            from "@/lib/supabase";

export type Tier = "free" | "pro" | "elite";

export function useSubscription() {
  const [tier,    setTier]    = useState<Tier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const res  = await fetch(`/api/subscription?userId=${data.user.id}`);
      const sub  = await res.json();
      setTier(sub.tier ?? "free");
      setLoading(false);
    });
  }, []);

  const canUseFeature = (feature: string): boolean => {
    const proFeatures  = ["unlimited_alerts", "unlimited_ai", "scanner", "export"];
    const eliteFeatures = ["realtime_ebay", "priority_ai", "advanced_analytics"];
    if (eliteFeatures.includes(feature)) return tier === "elite";
    if (proFeatures.includes(feature))   return tier === "pro" || tier === "elite";
    return true; // free features
  };

  return { tier, loading, canUseFeature };
}
