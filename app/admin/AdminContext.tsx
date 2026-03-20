"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useWriteContract } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { createPublicClient, http, type Address } from "viem";
import { CONTRACTS, CHAIN_META, houseNftAbi, factoryAbi } from "@/lib/contracts";
import { activeChain } from "@/lib/wagmi-config";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Toast = {
  id: string;
  type: "info" | "success" | "error";
  title: string;
  detail?: string;
};

export interface AdminContextValue {
  publicClient: ReturnType<typeof createPublicClient>;
  walletAddress: Address | undefined;
  isLoading: boolean;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, "id">) => void;
  runTx: (
    label: string,
    params: Parameters<ReturnType<typeof useWriteContract>["writeContractAsync"]>[0]
  ) => Promise<`0x${string}` | null>;
  nftAdmin: string;
  nftNextTokenId: bigint | null;
  factoryOwner: string;
  auctionsList: string[];
  lastRefreshed: Date | null;
  refreshGlobal: () => Promise<void>;
  isNftAdmin: boolean;
  isFactoryOwner: boolean;
}

const AdminCtx = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be used inside AdminContext.Provider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export default function AdminContext({ children }: { children: React.ReactNode }) {
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address as Address | undefined;
  const { writeContractAsync } = useWriteContract();

  const publicClient = useMemo(
    () => createPublicClient({ chain: activeChain, transport: http(CHAIN_META.rpcDefault) }),
    []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nftAdmin, setNftAdmin] = useState("");
  const [nftNextTokenId, setNftNextTokenId] = useState<bigint | null>(null);
  const [factoryOwner, setFactoryOwner] = useState("");
  const [auctionsList, setAuctionsList] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const runTx = useCallback(
    async (
      label: string,
      params: Parameters<typeof writeContractAsync>[0]
    ): Promise<`0x${string}` | null> => {
      if (!walletAddress) {
        pushToast({ type: "error", title: "Connect wallet first" });
        return null;
      }
      setIsLoading(true);
      try {
        pushToast({ type: "info", title: `${label}…`, detail: "Approve in your wallet" });
        const hash = await writeContractAsync(params);
        pushToast({
          type: "success",
          title: `${label} confirmed`,
          detail: hash ? `TX: ${hash.slice(0, 14)}…` : undefined,
        });
        return hash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        pushToast({ type: "error", title: label, detail: msg.slice(0, 120) });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pushToast, walletAddress, writeContractAsync]
  );

  const refreshGlobal = useCallback(async () => {
    try {
      const [nftRes, factRes] = await Promise.all([
        publicClient.multicall({
          contracts: [
            { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "admin" },
            { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "nextTokenId" },
          ],
        }),
        publicClient.multicall({
          contracts: [
            { address: CONTRACTS.AuctionFactory, abi: factoryAbi, functionName: "owner" },
            { address: CONTRACTS.AuctionFactory, abi: factoryAbi, functionName: "getAuctions" },
          ],
        }),
      ]);
      setNftAdmin((nftRes[0].result as string) ?? "");
      setNftNextTokenId((nftRes[1].result as bigint) ?? null);
      setFactoryOwner((factRes[0].result as string) ?? "");
      setAuctionsList((factRes[1].result as string[]) ?? []);
      setLastRefreshed(new Date());
    } catch {
      pushToast({ type: "error", title: "Failed to load contract data" });
    }
  }, [publicClient, pushToast]);

  useEffect(() => {
    refreshGlobal();
  }, [refreshGlobal]);

  const isNftAdmin =
    !!walletAddress && !!nftAdmin && walletAddress.toLowerCase() === nftAdmin.toLowerCase();
  const isFactoryOwner =
    !!walletAddress && !!factoryOwner && walletAddress.toLowerCase() === factoryOwner.toLowerCase();

  return (
    <AdminCtx.Provider
      value={{
        publicClient,
        walletAddress,
        isLoading,
        toasts,
        pushToast,
        runTx,
        nftAdmin,
        nftNextTokenId,
        factoryOwner,
        auctionsList,
        lastRefreshed,
        refreshGlobal,
        isNftAdmin,
        isFactoryOwner,
      }}
    >
      {children}

      {/* Toast stack */}
      <div className="fixed right-4 top-20 z-50 space-y-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl px-4 py-3 text-sm shadow-xl pointer-events-auto ${
              t.type === "error"
                ? "bg-red-500/95 text-white"
                : t.type === "success"
                ? "bg-emerald-500/95 text-white"
                : "bg-white/10 text-white backdrop-blur border border-white/10"
            }`}
          >
            <div className="font-semibold">{t.title}</div>
            {t.detail && <div className="text-xs opacity-80 mt-0.5 break-all">{t.detail}</div>}
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-8 py-5 text-sm font-medium backdrop-blur">
            Processing transaction…
          </div>
        </div>
      )}
    </AdminCtx.Provider>
  );
}
