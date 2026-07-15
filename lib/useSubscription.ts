"use client";

import { useState, useEffect } from "react";
import { supabase }            from "@/lib/supabase";

export type Tier = "free" | "pro" | "elite";

export const LIMITS = {
  free: {
    maxAlerts:    3,
    maxAiMessages: 5,
    scanner:      false,
    export:       false,
    realtimeEbay: false,
  },
  pro: {
    maxAlerts:     999,
    maxAiMessages: 999,
    scanner:       true,
    export:        true,
    realtimeEbay:  false,
  },
  elite: {
    maxAlerts:     999,
    maxAiMessages: 999,
    scanner:       true,
    export:        true,
    realtimeEbay:  true,
  },
};

export function useSubscription() {
  const [tier,    setTier]    = useState<Tier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/subscription?userId=${data.user.id}`);
        const sub = await res.json();
        setTier(sub.tier ?? "free");
      } catch {
        setTier("free");
      }
      setLoading(false);
    });
  }, []);

  const limits = LIMITS[tier];

  const canUseFeature = (feature: keyof typeof LIMITS.free): boolean => {
    return !!limits[feature];
  };

  return { tier, loading, limits, canUseFeature };
}
