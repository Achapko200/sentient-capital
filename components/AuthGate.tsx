"use client";

import { useRouter }     from "next/navigation";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useAuth }       from "@/lib/auth-context";

type Props = {
  children:  React.ReactNode;
  fallback?: "redirect" | "inline"; // redirect to /login or show inline prompt
};

export default function AuthGate({ children, fallback = "inline" }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback === "redirect") {
      router.push("/login");
      return null;
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h3 className="text-gray-900 font-black text-lg mb-2">Connect your wallet</h3>
        <p className="text-gray-500 text-sm mb-6">
          You need to connect a wallet to access this feature
        </p>
        <div className="flex justify-center">
          <DynamicWidget />
        </div>
        <p className="text-gray-400 text-xs mt-4">
          No email required — just your crypto wallet
        </p>
      </div>
    );
  }

  return <>{children}</>;
}