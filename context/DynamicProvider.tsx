"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { AuthProvider }             from "@/lib/auth-context";

export default function DynamicProvider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId:    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "60c3d4d5-b156-4ab8-aac8-8839e1e37963",
        walletConnectors: [EthereumWalletConnectors],
        appName:          "Card Tracker",
      }}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </DynamicContextProvider>
  );
}