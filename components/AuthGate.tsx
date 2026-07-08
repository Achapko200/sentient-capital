"use client";

import { useEffect }  from "react";
import { useRouter }  from "next/navigation";
import { useAuth }    from "@/lib/auth-context";

type Props = {
  children:  React.ReactNode;
  fallback?: "redirect" | "inline";
};

export default function AuthGate({ children, fallback = "inline" }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && fallback === "redirect") {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, fallback, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h3 className="text-gray-900 font-black text-lg mb-2">Sign in to continue</h3>
        <p className="text-gray-500 text-sm mb-6">
          You need to sign in to access this feature
        </p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 rounded-xl font-black text-sm text-white transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
        >
          Sign in / Sign up
        </button>
        <p className="text-gray-400 text-xs mt-4">
          Email · Google · Crypto wallet
        </p>
      </div>
    );
  }

  return <>{children}</>;
}