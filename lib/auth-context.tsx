"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useDynamicContext }                               from "@dynamic-labs/sdk-react-core";
import { supabase }                                        from "@/lib/supabase";

type AuthState = {
  isAuthenticated: boolean;
  wallet:          string | null;
  email:           string | null;
  isLoading:       boolean;
  signOut:         () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  wallet:          null,
  email:           null,
  isLoading:       true,
  signOut:         async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { primaryWallet, user: dynamicUser, sdkHasLoaded, handleLogOut } = useDynamicContext();
  const [emailUser, setEmailUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check existing session immediately on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setEmailUser({ email: data.session.user.email });
      }
      setIsLoading(false);
    });

    // Listen for all auth changes (Google OAuth, email login, logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setEmailUser({ email: session.user.email });
      } else {
        setEmailUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Also update loading when Dynamic SDK loads
  useEffect(() => {
    if (sdkHasLoaded) setIsLoading(false);
  }, [sdkHasLoaded]);

  const signOut = async () => {
    await supabase.auth.signOut();
    try { await handleLogOut(); } catch {}
    setEmailUser(null);
    window.location.href = "/";
  };

  const isWalletAuth = !!dynamicUser && !!primaryWallet;
  const isEmailAuth  = !!emailUser;

  return (
    <AuthContext.Provider value={{
      isAuthenticated: isWalletAuth || isEmailAuth,
      wallet:          primaryWallet?.address ?? null,
      email:           emailUser?.email ?? dynamicUser?.email ?? null,
      isLoading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}