"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

type AuthState = {
  isAuthenticated: boolean;
  wallet:          string | null;
  isLoading:       boolean;
};

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  wallet:          null,
  isLoading:       true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { primaryWallet, user, sdkHasLoaded } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sdkHasLoaded) setIsLoading(false);
  }, [sdkHasLoaded]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user && !!primaryWallet,
      wallet:          primaryWallet?.address ?? null,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}