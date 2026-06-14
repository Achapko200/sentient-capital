"use client";

// ─── components/cards/BuyWithCrypto.tsx ──────────────────────────────────────
// Real crypto buy flow using Coinbase Wallet + Base network

import { useState, useEffect }          from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits }      from "viem";
import { coinbaseWallet }               from "wagmi/connectors";
import { USDC_ADDRESS, USDC_ABI }       from "@/lib/wagmi-config";
import type { Listing }                 from "@/lib/listings";

type Props = {
  listing: Listing;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
};

type Step = "connect" | "confirm" | "pending" | "success" | "error";

export default function BuyWithCrypto({ listing, onClose, onSuccess }: Props) {
  const [step,     setStep]     = useState<Step>("connect");
  const [ethPrice, setEthPrice] = useState<number>(3500);
  const [error,    setError]    = useState<string>("");

  const { address, isConnected } = useAccount();
  const { connect }              = useConnect();
  const { disconnect }           = useDisconnect();

  const {
    writeContract,
    data: txHash,
    isPending: isSending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Fetch live ETH price
  useEffect(() => {
    fetch("/api/cards/crypto-prices")
      .then((r) => r.json())
      .then((d) => {
        const eth = d.prices?.find((p: { symbol: string }) => p.symbol === "ETH");
        if (eth) setEthPrice(eth.usd);
      })
      .catch(() => {});
  }, []);

  // Move to confirm once connected
  useEffect(() => {
    if (isConnected && step === "connect") setStep("confirm");
  }, [isConnected, step]);

  // Handle success
  useEffect(() => {
    if (isSuccess && txHash) {
      setStep("success");
      // Mark listing as sold via API
      fetch(`/api/cards/listings/${listing.id}/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      }).catch(() => {});
      onSuccess(txHash);
    }
  }, [isSuccess, txHash, listing.id, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      setError(writeError.message?.slice(0, 100) ?? "Transaction failed");
      setStep("error");
    }
  }, [writeError]);

  const usdcAmount = listing.priceUSD; // 1 USDC = $1
  const ethAmount  = (listing.priceUSD / ethPrice).toFixed(6);

  const handleBuyUSDC = () => {
    setStep("pending");
    writeContract({
      address:      USDC_ADDRESS,
      abi:          USDC_ABI,
      functionName: "transfer",
      args: [
        listing.sellerWallet as `0x${string}`,
        parseUnits(usdcAmount.toString(), 6), // USDC has 6 decimals
      ],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-gray-100">
          <div>
            <h3 className="text-gray-900 font-black text-lg">Buy with Crypto</h3>
            <p className="text-gray-400 text-sm">{listing.playerName} — {listing.grade}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Price */}
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
            <p className="text-gray-400 text-xs mb-1">Card price</p>
            <p className="text-gray-900 text-3xl font-black">${listing.priceUSD}</p>
            <div className="flex justify-center gap-4 mt-2">
              <span className="text-blue-600 font-bold text-sm">{usdcAmount} USDC</span>
              <span className="text-gray-300">·</span>
              <span className="text-blue-500 font-bold text-sm">{ethAmount} ETH</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">on Base network</p>
          </div>

          {/* STEP: Connect wallet */}
          {step === "connect" && (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm text-center">Connect your Coinbase Wallet to continue</p>
              <button
                onClick={() => connect({ connector: coinbaseWallet({ appName: "Card Tracker" }) })}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔵</span>
                Connect Coinbase Wallet
              </button>
              <p className="text-gray-400 text-xs text-center">
                Make sure you're on the Base network
              </p>
            </div>
          )}

          {/* STEP: Confirm purchase */}
          {step === "confirm" && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-700 text-xs font-semibold">✓ Wallet connected</p>
                <p className="text-green-600 text-xs font-mono mt-0.5">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">To</span>
                  <span className="text-gray-700 font-mono">{listing.sellerWallet.slice(0,6)}...{listing.sellerWallet.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network</span>
                  <span className="text-gray-700 font-semibold">Base</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gas fee</span>
                  <span className="text-gray-700">~$0.01</span>
                </div>
              </div>

              <button
                onClick={handleBuyUSDC}
                className="w-full py-3 rounded-xl bg-green-600 text-white font-black text-sm hover:bg-green-700 transition"
              >
                Pay {usdcAmount} USDC
              </button>

              <button
                onClick={() => { disconnect(); setStep("connect"); }}
                className="w-full py-2 text-gray-400 text-xs hover:text-gray-600 transition"
              >
                Disconnect wallet
              </button>
            </div>
          )}

          {/* STEP: Pending */}
          {(step === "pending" || isSending || isConfirming) && (
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl animate-spin inline-block">⏳</div>
              <p className="text-gray-700 font-bold">
                {isSending ? "Waiting for wallet approval..." : "Confirming on Base..."}
              </p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs underline"
                >
                  View on Basescan ↗
                </a>
              )}
            </div>
          )}

          {/* STEP: Success */}
          {step === "success" && (
            <div className="text-center space-y-3 py-4">
              <div className="text-5xl">🎉</div>
              <p className="text-gray-900 font-black text-lg">Purchase complete!</p>
              <p className="text-gray-500 text-sm">
                {listing.playerName} card is yours
              </p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 text-xs underline"
                >
                  View transaction on Basescan ↗
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition"
              >
                Done
              </button>
            </div>
          )}

          {/* STEP: Error */}
          {step === "error" && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-700 text-xs font-semibold">Transaction failed</p>
                <p className="text-red-500 text-xs mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setStep("confirm")}
                className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition"
              >
                Try again
              </button>
            </div>
          )}

          <p className="text-gray-400 text-xs text-center">
            Powered by Base · Coinbase Wallet · USDC
          </p>
        </div>
      </div>
    </div>
  );
}
