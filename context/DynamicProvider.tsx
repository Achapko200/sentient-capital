"use client";
import dynamic from "next/dynamic";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { LegacyEVMEmbeddedWalletConnectors } from "@dynamic-labs/embedded-wallet-evm";
import { AuthProvider }             from "@/lib/auth-context";

const LegacyWalletMigrationProvider = dynamic(
  () => import("@dynamic-labs/legacy-embedded-wallet-migration").then(module => module.LegacyWalletMigrationProvider),
  { ssr: false },
);

export default function DynamicProvider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId:             process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "60c3d4d5-b156-4ab8-aac8-8839e1e37963",
        walletConnectors:          [EthereumWalletConnectors, LegacyEVMEmbeddedWalletConnectors],
        appName:                   "Card Tracker",
        initialAuthenticationMode: "connect-only",
        enableConnectOnlyFallback: false,
      }}
    >
      <LegacyWalletMigrationProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LegacyWalletMigrationProvider>
    </DynamicContextProvider>
  );
}